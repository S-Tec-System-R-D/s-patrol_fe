import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import { fetchCourseHistory } from '@/features/course-history/api/getCourseHistory'
import { MAX_PAGE_SIZE } from '@/features/course-history/lib/courseHistoryListParams'

import { pickFinishedCourses } from '../lib/finishedCourses'
import { dashboardKeys } from '../queryKeys'

/**
 * 최근 종료된 순찰 (`spec 069`). `siteSeq` 가 `null` 이면 호출하지 않는다(`useTodaySummary` 와 같은 판단).
 *
 * 🔴 **5건이 아니라 100건(서버 상한)을 받는다** — 서버가 시작 순이라 5건만 받으면 오래 걸린 순찰이 빠진다.
 * 🔴 **어제부터 받는다** — 자정을 넘긴 순찰도 오늘 끝났으면 보여야 한다.
 */
export const useFinishedCourses = (siteSeq: number | null) => {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const params = {
    siteSeq: siteSeq ?? -1,
    fromDt: format(subDays(now, 1), 'yyyy-MM-dd'),
    toDt: today,
    pageNumber: 1,
    pageSize: MAX_PAGE_SIZE,
  }

  return useQuery({
    queryKey: dashboardKeys.finishedCourse(params),
    queryFn: () => fetchCourseHistory(params),
    enabled: siteSeq !== null,
    select: (data) => pickFinishedCourses(data.items, today),
  })
}
