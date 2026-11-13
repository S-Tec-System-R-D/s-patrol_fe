import { useMemo } from 'react'
import { ChevronRightIcon, HistoryIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { usePointHistory } from '@/features/points/hooks/usePointHistory'
import {
  groupHistoryByDay,
  summarizePatrolHistory,
  summaryFromDate,
  summaryToDate,
} from '@/features/points/lib/patrolSummary'
import { paths } from '@/router/paths'

/**
 * 지점 인증 상세 아래 **이 지점 최근 14일 한 줄** (`spec 078` 시안) — 예전 `이 지점의 최근 인증` 카드
 * (14일 점등 · 곡선 · 최근 8건)를 대신한다. 그 일은 **지점 상세(076)의 인증 기록**이 이미 한다 —
 * 여기서는 숫자 셋과 그리로 가는 길만 둔다.
 *
 * 🔴 숫자 규칙은 지점 상세와 같다(`summarizePatrolHistory`) — 인증 = 완료, 건너뜀 = 미완료(목록은 시각 있는
 * 행만 와서 늘 건너뜀이다), 특이사항 = 메모가 있는 기록.
 */

const PointRecentSummaryLine = ({ siteSeq, pointSeq }: { siteSeq: number | null; pointSeq: number }) => {
  // 🔴 기준일을 렌더마다 새로 만들지 않는다 — queryKey 가 바뀌어 무한 재조회가 된다
  const today = useMemo(() => new Date(), [])
  const history = usePointHistory(siteSeq, pointSeq, summaryFromDate(today), summaryToDate(today))
  const rows = useMemo(() => history.data?.items ?? [], [history.data])

  const summary = summarizePatrolHistory(rows, today)
  const memos = groupHistoryByDay(rows, today)
    .flatMap((group) => group.rows)
    .filter((row) => row.hasMemo).length

  return (
    <section
      aria-label="이 지점 최근 14일"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card px-5 py-3.5"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <HistoryIcon size={15} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-body font-semibold">이 지점 최근 14일</span>
        {history.isPending ? (
          <span className="h-4 w-40 animate-pulse rounded-sm bg-muted" />
        ) : history.isError ? (
          /* 🔴 조회 실패를 0건으로 보여주지 않는다 */
          <span className="text-caption text-muted-foreground">기록을 불러오지 못했습니다.</span>
        ) : (
          <span className="text-caption text-muted-foreground tabular-nums">
            인증 {summary.total} ·{' '}
            <span className={summary.missed > 0 ? 'font-semibold text-warning-foreground' : undefined}>
              건너뜀 {summary.missed}
            </span>{' '}
            · 특이사항 {memos}
          </span>
        )}
      </span>
      <Link
        to={paths.service.pointDetail(pointSeq)}
        className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-caption font-medium text-muted-foreground hover:text-foreground"
      >
        지점 상세에서 보기
        <ChevronRightIcon size={14} aria-hidden />
      </Link>
    </section>
  )
}

export default PointRecentSummaryLine
