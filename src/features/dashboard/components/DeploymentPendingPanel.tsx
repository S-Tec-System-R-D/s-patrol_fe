import { differenceInCalendarDays, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import DeploymentRequestActions from '@/features/deployments/components/DeploymentRequestActions'
import type { AssignmentRequestRow, RequestKind } from '@/features/deployments/types/deployment'
import { paths } from '@/router/paths'

import type { AreaState } from '../types'
import AreaFallback from './AreaFallback'

/**
 * 배치 대기 — `spec 073` T1216. 배치관리로 가지 않고 **대시보드에서 승인 · 반려**한다(분석 문서 §2).
 *
 * 🔄 **`spec 084`(사용자 결정 2026-11-20 — 목업 `01-대시보드` 모양으로)**: 요청 종류별 묶음을 없애고 **한 목록**으로.
 * 한 줄 = 이름 / 아래 작은 글자 `배치 요청 · 출발지 → 이 사업장 · n일 대기` + 오른쪽 `승인` · `반려`.
 * - `반려` 는 남긴다 — 빼면 대시보드에서 거절할 방법이 없어진다(목업에는 `승인` 만 있다).
 * - 기다린 날수는 남긴다 — 오래 묵은 요청을 알아보는 유일한 단서다. 배치 기간은 뺐다(배치관리 표에서 본다).
 * - 제목 옆에 합계를 적는다(묶음 제목의 `배치 요청 N` · `복귀 요청 N` 이 없어져 겹치지 않는다).
 *
 * 🔴 **버튼 · 확인 창 · 무효화는 배치관리와 같은 컴포넌트**(`DeploymentRequestActions`) — 승인은 즉시, 반려만
 * 확인 창. 승인하면 배치관리 쿼리(요약 · 요청 · 이력 · 사이드바 뱃지)가 함께 바뀐다.
 * 🔴 배치 요청은 실시간 알림이 없다 — 열 때 · 새로고침 · 승인/반려 뒤에만 바뀐다.
 * 🔴 **복귀 요청의 출발 · 도착은 원래 배치 방향 그대로다**(실측) — 복귀하는 곳은 `toSiteName`(지금 가 있는 곳)에서다.
 */

/** 요청한 날부터 오늘까지 — 같은 날이면 `오늘 요청` */
const waitingLabel = (createDt: string): string => {
  const parsed = parseISO(createDt)
  if (!isValid(parsed)) return ''
  const days = differenceInCalendarDays(new Date(), parsed)
  return days <= 0 ? '오늘 요청' : `${days}일 대기`
}

/** 이름 아래 한 줄 — 요청 종류 · 어디서 오는가 · 기다린 날수 */
const requestLine = (row: AssignmentRequestRow, kind: RequestKind): string =>
  [
    kind === 'return' ? '복귀 요청' : '배치 요청',
    `${kind === 'return' ? row.toSiteName : row.fromSiteName} → 이 사업장`,
    waitingLabel(row.createDt),
  ]
    .filter(Boolean)
    .join(' · ')

interface DeploymentPendingPanelProps {
  siteSeq: number
  requests: AssignmentRequestRow[]
  returns: AssignmentRequestRow[]
  state: AreaState
  onRetry: () => void
}

const DeploymentPendingPanel = ({ siteSeq, requests, returns, state, onRetry }: DeploymentPendingPanelProps) => {
  const rows: { row: AssignmentRequestRow; kind: RequestKind }[] = [
    ...requests.map((row) => ({ row, kind: 'deploy' as const })),
    ...returns.map((row) => ({ row, kind: 'return' as const })),
  ]

  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <h2 className="text-panel-title font-semibold text-foreground">배치 대기</h2>
        {state === 'ready' && rows.length > 0 && (
          <span className="text-caption text-muted-foreground tabular-nums">{rows.length}</span>
        )}
        <Link
          to={paths.service.deployments}
          aria-label="배치관리 전체"
          className="ml-auto flex shrink-0 items-center text-caption font-medium text-point hover:underline"
        >
          전체
          <ChevronRightIcon size={14} aria-hidden />
        </Link>
      </div>

      {state !== 'ready' ? (
        <AreaFallback state={state} label="배치 대기" onRetry={onRetry} />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-caption text-muted-foreground">대기 중인 배치 요청이 없습니다</p>
      ) : (
        <ul className="flex flex-col">
          {rows.map(({ row, kind }) => (
            <li
              key={`${kind}:${row.assignmentSeq}`}
              className="flex items-center gap-2.5 border-b border-border py-[9px] last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{row.userName}</p>
                <p className="truncate text-caption text-muted-foreground tabular-nums">{requestLine(row, kind)}</p>
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
      )}
    </section>
  )
}

export default DeploymentPendingPanel
