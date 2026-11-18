import { create } from 'zustand'
import { toSimError } from '../api/simError'

/**
 * 작업 실행기 (`spec 082`).
 *
 * 작업 하나를 실행하면 **실행(run)** 이 하나 생기고, 작업이 부르는 `ctx.step` 마다 **단계**가 쌓인다.
 * 여러 실행이 동시에 돈다. 단계가 실패하면 **그 실행만** 멈추고 다시 시도하지 않는다 —
 * 서버가 뭐라고 답했는지를 단계에 그대로 남긴다.
 *
 * 실행 기록은 메모리에만 있다(새로고침하면 사라진다).
 */
export type RunStatus = 'running' | 'done' | 'failed' | 'aborted'
/** `aborted` — 사용자가 중단해 끝나지 못한 단계(실패가 아니다) */
export type StepStatus = 'running' | 'done' | 'failed' | 'aborted'

export interface RunStep {
  id: number
  title: string
  status: StepStatus
  /** 결과 한마디 — 성공이면 작업이 준 요약, 실패면 HTTP 상태 + 서버 문구 */
  note?: string
  startedAt: number
  endedAt?: number
}

export interface Run {
  id: number
  taskName: string
  /** 무엇을 대상으로 하는지 — `근무자2 · 시뮬 단축 코스` */
  summary: string
  status: RunStatus
  steps: RunStep[]
  progress: { done: number; total: number } | null
  startedAt: number
  endedAt?: number
}

export interface TaskContext {
  signal: AbortSignal
  /**
   * 단계 하나를 실행하고 기록한다. `note` 는 성공했을 때 단계 옆에 보일 한마디.
   * 실패하면 단계를 실패로 남기고 **그대로 던진다**(실행이 멈춘다).
   */
  step<T>(title: string, fn: () => Promise<T>, note?: (result: T) => string | undefined): Promise<T>
  /** 실제로 기다린다(시간을 조작하지 않는다). 중단하면 바로 깨어난다 */
  wait(seconds: number, title?: string): Promise<void>
  setProgress(done: number, total: number): void
}

/** 사용자가 중단했다 — 실패가 아니다 */
class RunAborted extends Error {}

interface RunStore {
  runs: Run[]
  /** 실행을 시작하고 그 번호를 돌려준다. `onSettled` 는 끝난 뒤(성공 · 실패 · 중단) 한 번 불린다 */
  startRun(
    meta: { taskName: string; summary: string },
    body: (ctx: TaskContext) => Promise<void>,
    onSettled?: () => void
  ): number
  abortRun(id: number): void
  clearFinished(): void
}

const controllers = new Map<number, AbortController>()
let nextRunId = 1
let nextStepId = 1

const describeError = (error: unknown): string => {
  const simError = toSimError(error)
  return simError.status === null ? simError.message : `${simError.status} ${simError.message}`
}

export const useRunStore = create<RunStore>((set) => {
  const patchRun = (id: number, patch: (run: Run) => Run) =>
    set((state) => ({ runs: state.runs.map((run) => (run.id === id ? patch(run) : run)) }))

  const patchStep = (runId: number, stepId: number, patch: Partial<RunStep>) =>
    patchRun(runId, (run) => ({
      ...run,
      steps: run.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    }))

  return {
    runs: [],

    startRun(meta, body, onSettled) {
      const id = nextRunId++
      const controller = new AbortController()
      controllers.set(id, controller)
      const { signal } = controller

      set((state) => ({
        runs: [
          { id, ...meta, status: 'running', steps: [], progress: null, startedAt: Date.now() },
          ...state.runs,
        ],
      }))

      const step: TaskContext['step'] = async (title, fn, note) => {
        if (signal.aborted) throw new RunAborted()
        const stepId = nextStepId++
        patchRun(id, (run) => ({
          ...run,
          steps: [...run.steps, { id: stepId, title, status: 'running', startedAt: Date.now() }],
        }))
        try {
          const result = await fn()
          patchStep(id, stepId, { status: 'done', note: note?.(result), endedAt: Date.now() })
          return result
        } catch (error) {
          if (error instanceof RunAborted) {
            patchStep(id, stepId, { status: 'aborted', note: '중단', endedAt: Date.now() })
          } else {
            patchStep(id, stepId, { status: 'failed', note: describeError(error), endedAt: Date.now() })
          }
          throw error
        }
      }

      const wait: TaskContext['wait'] = (seconds, title) =>
        step(title ?? `대기 ${seconds}초`, () => {
          return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              signal.removeEventListener('abort', onAbort)
              resolve()
            }, seconds * 1000)
            const onAbort = () => {
              clearTimeout(timer)
              reject(new RunAborted())
            }
            signal.addEventListener('abort', onAbort, { once: true })
          })
        })

      const ctx: TaskContext = {
        signal,
        step,
        wait,
        setProgress: (done, total) => patchRun(id, (run) => ({ ...run, progress: { done, total } })),
      }

      const finish = (status: RunStatus) => {
        controllers.delete(id)
        patchRun(id, (run) => ({ ...run, status, endedAt: Date.now() }))
        onSettled?.()
      }

      body(ctx).then(
        () => finish('done'),
        (error: unknown) => finish(error instanceof RunAborted || signal.aborted ? 'aborted' : 'failed')
      )

      return id
    },

    abortRun(id) {
      controllers.get(id)?.abort()
    },

    clearFinished() {
      set((state) => ({ runs: state.runs.filter((run) => run.status === 'running') }))
    },
  }
})
