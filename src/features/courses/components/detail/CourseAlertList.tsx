import { format, isValid, parseISO } from 'date-fns'
import { ClockIcon, ShieldCheckIcon, TriangleAlertIcon, XCircleIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'

import { HISTORY_DAYS } from '@/features/course-history/lib/historyRange'
import type { CourseAlert, CourseAlertKind, CourseAlerts } from '../../lib/courseAlerts'

/**
 * 미인증 · 이상 이력 (`spec 023` 코스 상세 C단).
 *
 * 🔴 **요청이 늘지 않는다** — B단이 받아 둔 두 응답에서 모은다(`lib/courseAlerts.ts`).
 *
 * 🔴 **사유 문구가 없다.** 메모는 상세 조회에만 있어 행마다 요청이 붙고(N+1), 실측된
 * 내용은 `"[조명 고장] [누수]"` 처럼 **키워드 조합**이라 "왜 미인증인지" 가 아니다 —
 * 그대로 붙이면 틀린 설명이 된다. 그래서 **`메모` 뱃지만** 둔다: 기록이 있다는 사실은
 * 전하고, 내용은 이력 상세(`spec 025`)에서 보게 한다.
 *
 * 🔴 **빈 상태가 "좋은 상태" 다.** 이상이 없으면 경고 아이콘이 아니라 **방패 아이콘**으로
 * 적는다 — 0건을 비어 있는 실패처럼 보이게 하면 안 된다.
 */

interface CourseAlertListProps {
  alerts: CourseAlerts
  isPending?: boolean
}

const kindStyle: Record<CourseAlertKind, { icon: LucideIcon; className: string }> = {
  unchecked: { icon: TriangleAlertIcon, className: 'bg-warning-bg text-warning-foreground' },
  // 🔴 미완료가 가장 센 색이다 — "다 돌지 못했다" 는 지점 하나를 놓친 것보다 무겁다
  incomplete: { icon: XCircleIcon, className: 'bg-danger-bg text-danger-foreground' },
  overtime: { icon: ClockIcon, className: 'bg-warning-bg text-warning-foreground' },
}

/** ISO(타임존 없음) → `MM.dd`. 깨졌으면 비워 둔다(이상 이력 줄이 깨지는 것보다 낫다) */
const formatDay = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd') : ''
}

const AlertRow = ({ alert }: { alert: CourseAlert }) => {
  const { icon: Icon, className } = kindStyle[alert.kind]

  return (
    <li className="flex items-start gap-3 border-b py-2 last:border-0">
      <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${className}`}>
        <Icon size={13} strokeWidth={2} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-1.5 text-body font-semibold">
          {alert.title}
          {/* 🔴 내용이 아니라 **있다는 사실**이다. 문구를 지어내지 않는다 */}
          {alert.hasMemo && <AppBadge variant="muted">메모</AppBadge>}
        </span>
        <span className="truncate text-caption text-muted-foreground">{alert.meta}</span>
      </div>

      <span className="shrink-0 tabular-nums text-caption text-muted-foreground">
        {formatDay(alert.occurredAt)}
      </span>
    </li>
  )
}

const CourseAlertList = ({ alerts, isPending }: CourseAlertListProps) => (
  <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
    {/* 🔴 건수는 **제목 옆**이다 — 세 카드가 같은 모양을 쓴다(`CoursePatrolLog` 주석) */}
    <div className="flex items-baseline gap-2">
      <span className="text-panel-title font-semibold">미인증 · 이상 이력</span>
      <span className="text-caption text-muted-foreground">
        최근 {HISTORY_DAYS}일 · {alerts.totalCount}건
      </span>
    </div>

    {isPending ? (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    ) : alerts.totalCount === 0 ? (
      /* 🔴 **좋은 상태다.** 경고 아이콘·빈 상태 일러스트를 쓰지 않는다 */
      <div className="flex items-center gap-2 py-2 text-body text-muted-foreground">
        <ShieldCheckIcon size={16} strokeWidth={1.75} className="text-success-foreground" />
        최근 {HISTORY_DAYS}일 동안 이상이 없습니다.
      </div>
    ) : (
      <>
        <ul className="flex flex-col">
          {alerts.items.map((alert) => (
            <AlertRow key={alert.key} alert={alert} />
          ))}
        </ul>

        {/* 🔴 잘라냈으면 **잘랐다고 적는다** — 6건만 보고 "이상이 6건" 으로 읽으면 안 된다 */}
        {alerts.totalCount > alerts.items.length && (
          <p className="text-caption text-muted-foreground">
            {alerts.totalCount}건 중 최근 {alerts.items.length}건입니다.
          </p>
        )}
      </>
    )}
  </div>
)

export default CourseAlertList
