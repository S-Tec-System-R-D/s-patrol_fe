import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SimApiError } from '../../api/simError'
import { useRunStore, type Run } from '../runStore'

const run = (id: number): Run => {
  const found = useRunStore.getState().runs.find((item) => item.id === id)
  if (!found) throw new Error(`run ${id} 없음`)
  return found
}

/** 실행이 끝날 때까지 기다린다 */
const settled = (start: (onSettled: () => void) => number): Promise<number> =>
  new Promise((resolve) => {
    const id = start(() => resolve(id))
  })

beforeEach(() => {
  useRunStore.setState({ runs: [] })
})

describe('runStore', () => {
  it('단계를 순서대로 기록하고 완료로 끝난다', async () => {
    const id = await settled((done) =>
      useRunStore.getState().startRun(
        { taskName: '작업', summary: '요약' },
        async (ctx) => {
          await ctx.step('하나', async () => 1, (value) => `결과 ${value}`)
          ctx.setProgress(1, 2)
          await ctx.step('둘', async () => 2)
          ctx.setProgress(2, 2)
        },
        done
      )
    )

    expect(run(id)).toMatchObject({ status: 'done', progress: { done: 2, total: 2 } })
    expect(run(id).steps.map((step) => [step.title, step.status, step.note])).toEqual([
      ['하나', 'done', '결과 1'],
      ['둘', 'done', undefined],
    ])
  })

  it('단계가 실패하면 그 실행만 멈추고 서버 문구를 남긴다 — 다음 단계는 실행하지 않는다', async () => {
    const never = vi.fn()
    const id = await settled((done) =>
      useRunStore.getState().startRun(
        { taskName: '작업', summary: '' },
        async (ctx) => {
          await ctx.step('성공', async () => true)
          await ctx.step('실패', async () => {
            throw new SimApiError(400, '이미 사용 중인 아이디입니다.', null)
          })
          await ctx.step('안 온다', never)
        },
        done
      )
    )

    expect(run(id).status).toBe('failed')
    expect(run(id).steps.map((step) => [step.title, step.status, step.note])).toEqual([
      ['성공', 'done', undefined],
      ['실패', 'failed', '400 이미 사용 중인 아이디입니다.'],
    ])
    expect(never).not.toHaveBeenCalled()
  })

  it('한 실행이 실패해도 다른 실행은 계속 돈다', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    const slow = settled((done) =>
      useRunStore.getState().startRun(
        { taskName: '느린 작업', summary: '' },
        (ctx) => ctx.step('기다림', () => gate),
        done
      )
    )
    const failedId = await settled((done) =>
      useRunStore.getState().startRun(
        { taskName: '실패 작업', summary: '' },
        (ctx) => ctx.step('실패', () => Promise.reject(new Error('boom'))),
        done
      )
    )

    expect(run(failedId).status).toBe('failed')
    release()
    expect(run(await slow).status).toBe('done')
  })

  it('대기 중에 중단하면 바로 깨어나 중단으로 끝난다', async () => {
    const never = vi.fn()
    let started: () => void = () => {}
    const waiting = new Promise<void>((resolve) => {
      started = resolve
    })

    const finished = settled((done) =>
      useRunStore.getState().startRun(
        { taskName: '작업', summary: '' },
        async (ctx) => {
          queueMicrotask(started)
          await ctx.wait(60)
          await ctx.step('안 온다', never)
        },
        done
      )
    )

    await waiting
    const [{ id }] = useRunStore.getState().runs
    useRunStore.getState().abortRun(id)

    expect(run(await finished).status).toBe('aborted')
    expect(run(id).steps).toMatchObject([{ title: '대기 60초', status: 'aborted', note: '중단' }])
    expect(never).not.toHaveBeenCalled()
  })

  it('끝난 실행 지우기는 실행 중인 것을 남긴다', async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const slow = settled((done) =>
      useRunStore.getState().startRun({ taskName: '느린 작업', summary: '' }, (ctx) => ctx.step('기다림', () => gate), done)
    )
    await settled((done) =>
      useRunStore.getState().startRun({ taskName: '끝난 작업', summary: '' }, async () => {}, done)
    )

    useRunStore.getState().clearFinished()

    expect(useRunStore.getState().runs.map((item) => item.taskName)).toEqual(['느린 작업'])
    release()
    await slow
  })
})
