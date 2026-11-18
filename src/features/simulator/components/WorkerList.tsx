import type { UseQueryResult } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import type { WorkerStatus } from '../api/siteData'
import { toSimError } from '../api/simError'
import { assignmentStateOf, type AssignmentKind } from '../lib/assignmentState'
import type { ActivePatrol, SimSiteUser } from '../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Spinner } from '../ui/spinner'
import { Switch } from '../ui/switch'

/**
 * 근무자 목록 (`spec 082` US1 · US4).
 *
 * 🔴 **근무자 한 명에 대한 동작은 그 줄에서 한다**(사용자 결정 2026-11-18) — 근무 스위치 · 배치 요청 ·
 * 복귀 요청 · 순찰 종료. 줄에는 **그 근무자의 지금 상태에서 할 수 있는 것만** 보인다
 * (배치 중이 아니면 복귀 요청 버튼이 없다 — 잘못된 대상에게 보낼 수 없다).
 */
export interface WorkerActions {
  onToggleWork(worker: SimSiteUser, workYn: boolean): void
  onRequestAssignment(worker: SimSiteUser): void
  onRequestReturn(worker: SimSiteUser, assignmentSeq: number): void
  onEndPatrol(worker: SimSiteUser): void
}

/** 끝난 지점 줄 — 3 미완료(건너뜀) · 4 완료 (`docs/app-api-spec.md` §2) */
const isDone = (detailStatus: number) => detailStatus === 3 || detailStatus === 4

const patrolLabel = (patrol: ActivePatrol): string => {
  const done = patrol.details.filter((detail) => isDone(detail.detailStatus)).length
  const state = patrol.patrolStatus === 2 ? '교대 요청 중' : '순찰 중'
  return `${state} · ${patrol.courseName} ${done}/${patrol.details.length}`
}

/** 배치 단계의 색 — 배치 중은 강조색, 승인을 기다리는 동안은 주황, 거절은 빨강 */
const ASSIGNMENT_TONE: Record<AssignmentKind, string> = {
  home: '',
  'assign-pending': 'text-(--sim-warn)',
  'assign-rejected': 'text-destructive',
  assigned: 'text-primary',
  'return-pending': 'text-(--sim-warn)',
  'return-rejected': 'text-primary',
}

function WorkerRow({
  worker,
  status,
  siteSeq,
  actions,
}: {
  worker: SimSiteUser
  status: UseQueryResult<WorkerStatus>
  siteSeq: number
  actions: WorkerActions
}) {
  const error = status.error ? toSimError(status.error) : null
  // 응답이 없으면(네트워크 · CORS) 계정 문제가 아니라 서버 연결 문제다
  const errorLabel = error ? (error.status === null ? '앱 서버 연결 실패' : '로그인 불가') : null
  const data = status.data
  const patrol = data?.activePatrol ?? null
  const assignment = data ? assignmentStateOf(data.detail, siteSeq) : null
  const away = assignment?.kind === 'assigned' || assignment?.kind === 'return-rejected'

  return (
    <li className={cn('border-b px-3 py-2 last:border-b-0', away && 'bg-primary/5')}>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            'size-2 shrink-0 rounded-full',
            error ? 'bg-destructive' : patrol ? 'bg-primary' : data ? 'bg-muted-foreground/50' : 'bg-transparent'
          )}
        />
        <p className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate text-sm font-medium">{worker.userName}</span>
          <span className="sim-mono text-xs text-muted-foreground">{worker.loginId}</span>
        </p>
        {status.isPending && <Spinner className="size-3.5 text-muted-foreground" />}
        {errorLabel && <Badge variant="destructive">{errorLabel}</Badge>}
        {data && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            근무
            <Switch
              size="sm"
              aria-label={`${worker.userName} 근무`}
              checked={data.today.workYn}
              onCheckedChange={(checked) => actions.onToggleWork(worker, checked)}
            />
          </label>
        )}
      </div>

      {(patrol || assignment?.label || error || assignment?.action) && (
        <div className="mt-1 flex items-center gap-2 pl-[18px]">
          <div className="min-w-0 flex-1 text-xs">
            {patrol && <p className="truncate text-primary">{patrolLabel(patrol)}</p>}
            {assignment?.label && (
              <p className={cn('truncate', ASSIGNMENT_TONE[assignment.kind])}>{assignment.label}</p>
            )}
            {error && (
              <p className="truncate text-destructive" title={error.message}>
                {error.status !== null && <span className="sim-mono">{error.status} </span>}
                {error.message}
              </p>
            )}
          </div>
          {patrol && (
            <Button variant="outline" size="xs" onClick={() => actions.onEndPatrol(worker)}>
              순찰 종료
            </Button>
          )}
          {assignment?.action === 'assign' && (
            <Button variant="secondary" size="xs" onClick={() => actions.onRequestAssignment(worker)}>
              배치 요청
            </Button>
          )}
          {assignment?.action === 'return' && assignment.assignmentSeq !== null && (
            <Button size="xs" onClick={() => actions.onRequestReturn(worker, assignment.assignmentSeq!)}>
              복귀 요청
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

export function WorkerList({
  workers,
  statuses,
  siteSeq,
  actions,
}: {
  workers: SimSiteUser[]
  statuses: UseQueryResult<WorkerStatus>[]
  siteSeq: number
  actions: WorkerActions
}) {
  if (workers.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        이 사업장에는 근무자가 없습니다.
      </p>
    )
  }
  return (
    <ul>
      {workers.map((worker, index) => (
        <WorkerRow
          key={worker.userSeq}
          worker={worker}
          status={statuses[index]}
          siteSeq={siteSeq}
          actions={actions}
        />
      ))}
    </ul>
  )
}
