import type { PointHistoryRow } from '@/features/course-history/types'

/**
 * 최근 미완료 · 시간초과 합치기 — `spec 068`.
 *
 * 서버는 `status=3` · `overTimeYn=true` 를 함께 주면 AND 라 **따로 2번** 받는다. 미완료이면서 시간초과인 행은
 * 양쪽에 나오므로 `detailSeq` 로 하나만 남기고, 최근 순으로 앞 5건을 쓴다.
 */

export const RECENT_ISSUE_LIMIT = 5

export const mergeRecentIssues = (...lists: PointHistoryRow[][]): PointHistoryRow[] => {
  const byDetail = new Map<number, PointHistoryRow>()
  lists.flat().forEach((row) => byDetail.set(row.detailSeq, row))
  return [...byDetail.values()]
    .sort((a, b) => b.checkDt.localeCompare(a.checkDt))
    .slice(0, RECENT_ISSUE_LIMIT)
}
