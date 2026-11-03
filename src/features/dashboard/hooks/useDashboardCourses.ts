import { useQuery } from '@tanstack/react-query'

import { fetchDashboardCourseList } from '../api/getDashboardCourseList'
import { dashboardKeys } from '../queryKeys'

/**
 * 진행 중 회차 (`spec 068` T1129). `siteSeq` 가 `null` 이면 호출하지 않는다(`useTodaySummary` 와 같은 판단).
 *
 * 경과 시간은 응답의 `dataUpdatedAt`(받은 시각)부터 화면이 센다 — `elapsedMinAt`.
 */
export const useDashboardCourses = (siteSeq: number | null) =>
  useQuery({
    queryKey: dashboardKeys.courses(siteSeq ?? -1),
    queryFn: () => fetchDashboardCourseList(siteSeq as number),
    enabled: siteSeq !== null,
  })
