import { differenceInCalendarDays, format, isValid, parseISO } from 'date-fns'
import { Building2Icon, CalendarIcon, ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import DeploymentRequestActions from '@/features/deployments/components/DeploymentRequestActions'
import type { AssignmentRequestRow, RequestKind } from '@/features/deployments/types/deployment'
import { paths } from '@/router/paths'

import type { AreaState } from '../types'
import AreaFallback from './AreaFallback'

/**
 * 배치 대기 — `spec 073` T1216. 배치관리로 가지 않고 **대시보드에서 승인 · 반려**한다(분석 문서 §2).
 *
 * 🔴 **버튼 · 확인 창 · 무효화는 배치관리와 같은 컴포넌트**(`DeploymentRequestActions`) — 승인은 즉시, 반려만
 * 확인 창. 승인하면 배치관리 쿼리(요약 · 요청 · 이력 · 사이드바 뱃지)가 함께 바뀐다.
 * 🔴 **아바타 없음 · 작은 버튼**(사용자 결정 2026-11-12) — 이니셜 아바타는 옆 이름과 같은 정보, 큰 버튼은 출발지 · 기간을 잘랐다.
 * 🔴 배치 요청은 실시간 알림이 없다 — 열 때 · 새로고침 · 승인/반려 뒤에만 바뀐다.
 * 🔴 **복귀 요청의 출발 · 도착은 원래 배치 방향 그대로다**(실측) — 복귀하는 곳은 `toSiteName`(지금 가 있는 곳)에서다.
 */

const formatDate = (value: string | null): string => {
  if (value === null) return '미정'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd') : value
}

/** 요청한 날부터 오늘까지 — 같은 날이면 `오늘 요청` */
const waitingLabel = (createDt: string): string => {
  const parsed = parseISO(createDt)
  if (!isValid(parsed)) return ''
  const days = differenceInCalendarDays(new Date(), parsed)
  return days <= 0 ? '오늘 요청' : `${days}일 대기`
}

/**
 * 출발 사업장 · 기간 — 아이콘으로 무엇인지 구분한다(사용자 요청 2026-11-12).
 * 사유는 대시보드에서 보이지 않는다(배치관리 표에서 본다 · 사용자 결정 2026-11-12).
 */
const RequestDetail = ({ row, kind }: { row: AssignmentRequestRow; kind: RequestKind }) => (
  <span className="flex min-w-0 items-center gap-3 text-caption text-muted-foreground">
    <span className="flex min-w-0 items-center gap-1">
      <Building2Icon size={12} className="shrink-0" aria-hidden />
      <span className="truncate">{kind === 'return' ? row.toSiteName : row.fromSiteName}</span>
    </span>
    {kind === 'deploy' && (
      <span className="flex shrink-0 items-center gap-1 tabular-nums">
        <CalendarIcon size={12} aria-hidden />
        {formatDate(row.startDt)} ~ {formatDate(row.plannedEndDt)}
      </span>
    )}
  </span>
)

interface GroupProps {
  title: string
  kind: RequestKind
  rows: AssignmentRequestRow[]
  siteSeq: number
}

const RequestGroup = ({ title, kind, rows, siteSeq }: GroupProps) => (
  <div className="flex flex-col">
    <h3 className="pb-1 text-caption font-medium text-muted-foreground">
      {title} <span className="tabular-nums">{rows.length}</span>
    </h3>
    <ul className="flex flex-col">
      {rows.map((row) => (
        <li
          key={row.assignmentSeq}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border py-2.5 last:border-0"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex items-baseline gap-2 text-body">
              <span className="font-semibold text-foreground">{row.userName}</span>
              <span className="shrink-0 text-caption font-medium text-warning-foreground">
                {waitingLabel(row.createDt)}
              </span>
            </span>
            <RequestDetail row={row} kind={kind} />
          </div>
          <DeploymentRequestActions
            kind={kind}
            assignmentSeq={row.assignmentSeq}
            userName={row.userName}
            siteSeq={siteSeq}
            compact
          />
        </li>
      ))}
    </ul>
  </div>
)

interface DeploymentPendingPanelProps {
  siteSeq: number
  requests: AssignmentRequestRow[]
  returns: AssignmentRequestRow[]
  state: AreaState
  onRetry: () => void
}

const DeploymentPendingPanel = ({ siteSeq, requests, returns, state, onRetry }: DeploymentPendingPanelProps) => {
  const total = requests.length + returns.length

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {/* 합계 없음 — 아래 `배치 요청 N` · `복귀 요청 N` 과 겹친다(사용자 결정 2026-11-12, T1226) */}
        <h2 className="text-panel-title font-bold text-foreground">배치 대기</h2>
        <Link
          to={paths.service.deployments}
          className="ml-auto flex shrink-0 items-center text-caption text-muted-foreground hover:text-foreground"
        >
          배치관리
          <ChevronRightIcon size={14} />
        </Link>
      </div>

      {state !== 'ready' ? (
        <AreaFallback state={state} label="배치 대기" onRetry={onRetry} />
      ) : total === 0 ? (
        <p className="py-6 text-center text-caption text-muted-foreground">대기 중인 배치 요청이 없습니다</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.length > 0 && <RequestGroup title="배치 요청" kind="deploy" rows={requests} siteSeq={siteSeq} />}
          {returns.length > 0 && <RequestGroup title="복귀 요청" kind="return" rows={returns} siteSeq={siteSeq} />}
        </div>
      )}
    </section>
  )
}

export default DeploymentPendingPanel
