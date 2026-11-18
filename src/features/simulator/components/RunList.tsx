import { BanIcon, CheckIcon, CircleDashedIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRunStore, type Run, type RunStatus, type RunStep } from '../engine/runStore'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../ui/trace'

/**
 * 실행 목록 (`spec 082` US5) — 실행 하나가 한 줄, 펼치면 단계 로그.
 *
 * 상태 색(사용자 결정): **지금 움직이는 것만 색**으로 보인다 —
 * 실행 중 = 강조색 + 반짝임 / 완료 = 회색 체크 / 실패 = 빨강 / 중단 = 주황.
 */
const STATUS_LABEL: Record<RunStatus, string> = {
  running: '실행 중',
  done: '완료',
  failed: '실패',
  aborted: '중단',
}

const seconds = (from: number, to: number | undefined) =>
  to === undefined ? null : `${((to - from) / 1000).toFixed(1)}s`

const pad = (value: number) => String(value).padStart(2, '0')

/** `15:16:32` — 로케일 표기(`15시 16분 32초`)는 로그에서 자리를 많이 먹는다 */
const clock = (at: number) => {
  const date = new Date(at)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function RunStatusIcon({ status }: { status: RunStatus }) {
  if (status === 'running') return <Spinner className="text-primary" />
  if (status === 'done') return <CheckIcon className="text-muted-foreground" />
  if (status === 'failed') return <XIcon className="text-destructive" />
  return <BanIcon className="text-(--sim-warn)" />
}

function StepLine({ step }: { step: RunStep }) {
  return (
    <TraceLine
      status={step.status === 'running' ? 'running' : step.status === 'failed' ? 'error' : undefined}
      className="w-full"
    >
      <TraceIcon>
        {step.status === 'running' ? (
          <CircleDashedIcon className="text-primary" />
        ) : step.status === 'failed' ? (
          <XIcon />
        ) : step.status === 'aborted' ? (
          <BanIcon className="text-(--sim-warn)" />
        ) : (
          <CheckIcon />
        )}
      </TraceIcon>
      <TraceDescription className="sim-mono text-xs">{clock(step.startedAt)}</TraceDescription>
      <TraceTitle>{step.title}</TraceTitle>
      {step.note && (
        <TraceDescription
          className={cn(
            'min-w-0 shrink truncate',
            step.status === 'failed' && 'text-destructive',
            step.status === 'aborted' && 'text-(--sim-warn)'
          )}
        >
          {step.note}
        </TraceDescription>
      )}
      <TraceDescription className="sim-mono ml-auto text-xs">
        {seconds(step.startedAt, step.endedAt)}
      </TraceDescription>
    </TraceLine>
  )
}

function RunRow({ run }: { run: Run }) {
  const abortRun = useRunStore((state) => state.abortRun)

  return (
    <li className="border-b px-3 py-2 last:border-b-0">
      {/* 실행 중이거나 실패한 것은 펼쳐서 보인다 — 끝난 것은 접어 둔다 */}
      <TraceCollapsible defaultOpen={run.status !== 'done'}>
        <div className="flex items-center gap-2">
          <TraceCollapsibleTrigger className="min-w-0 flex-1 justify-start">
            <TraceLine
              status={run.status === 'running' ? 'running' : run.status === 'failed' ? 'error' : undefined}
              className={cn(run.status === 'aborted' && 'text-(--sim-warn)')}
            >
              <TraceIcon>
                <RunStatusIcon status={run.status} />
              </TraceIcon>
              <TraceTitle className="font-medium text-foreground">{run.taskName}</TraceTitle>
              <TraceDescription className="min-w-0 shrink truncate">{run.summary}</TraceDescription>
            </TraceLine>
          </TraceCollapsibleTrigger>

          {run.progress && (
            <span className="sim-mono text-xs text-muted-foreground">
              {run.progress.done}/{run.progress.total}
            </span>
          )}
          <span
            className={cn(
              'text-xs',
              run.status === 'running' && 'text-primary',
              run.status === 'done' && 'text-muted-foreground',
              run.status === 'failed' && 'text-destructive',
              run.status === 'aborted' && 'text-(--sim-warn)'
            )}
          >
            {STATUS_LABEL[run.status]}
          </span>
          <span className="sim-mono w-12 text-right text-xs text-muted-foreground">
            {seconds(run.startedAt, run.endedAt) ?? clock(run.startedAt).slice(0, 5)}
          </span>
          {run.status === 'running' && (
            <Button variant="outline" size="xs" onClick={() => abortRun(run.id)}>
              중단
            </Button>
          )}
        </div>

        <TraceCollapsibleContent>
          <Trace className="gap-1.5">
            {run.steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">아직 단계가 없습니다.</p>
            ) : (
              run.steps.map((step) => <StepLine key={step.id} step={step} />)
            )}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </li>
  )
}

export function RunList() {
  const runs = useRunStore((state) => state.runs)

  if (runs.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">실행한 작업이 여기에 쌓입니다.</p>
    )
  }
  return (
    <ul>
      {runs.map((run) => (
        <RunRow key={run.id} run={run} />
      ))}
    </ul>
  )
}
