import { useQueries } from '@tanstack/react-query'

import { POINT_HISTORY_STATUS } from '@/features/course-history/types'

import { fetchDashboardPointHistory } from '../api/getDashboardPointHistory'
import { mergeRecentIssues, RECENT_ISSUE_LIMIT } from '../lib/recentIssues'
import { dashboardKeys } from '../queryKeys'

/**
 * 최근 미완료 · 시간초과 (`spec 068` T1132) — **2번 호출**(`status=3` · `overTimeYn=true`)을 합친다.
 *
 * 🔴 **하나라도 실패하면 영역 전체가 오류다** — 반쪽 목록을 정상처럼 보이면 "시간초과가 없다" 로 읽힌다.
 * `siteSeq` 가 `null` 이면 호출하지 않는다(`useTodaySummary` 와 같은 판단).
 */

const FILTERS = [{ status: POINT_HISTORY_STATUS.INCOMPLETE }, { overTimeYn: true }]

export const useRecentIssues = (siteSeq: number | null) =>
  useQueries({
    queries: FILTERS.map((filter) => {
      const params = { siteSeq: siteSeq ?? -1, ...filter, pageNumber: 1, pageSize: RECENT_ISSUE_LIMIT }
      return {
        queryKey: dashboardKeys.pointHistory(params),
        queryFn: () => fetchDashboardPointHistory(params),
        enabled: siteSeq !== null,
      }
    }),
    combine: (results) => ({
      rows: mergeRecentIssues(...results.map((result) => result.data?.items ?? [])),
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      refetch: () => Promise.all(results.map((result) => result.refetch())),
    }),
  })
