import { useQueries } from '@tanstack/react-query'

import { fetchCourseHistoryHandOvers } from '@/features/course-history/api/getCourseHistoryHandOvers'
import type { HandOverRow } from '@/features/course-history/types'

import { dashboardKeys } from '../queryKeys'
import type { DashboardCourse } from '../types'

/**
 * 진행 중 회차의 교대 기록 (`spec 070`) — 교대가 있는 카드만 부른다. 진행 중에도 바로 나온다(실측 2026-11-05 회차 101).
 *
 * 🔴 **키에 `handoverCount` 를 넣는다** — 목록을 다시 받아 횟수가 바뀌면 저절로 새로 받는다. 알림 처리는 건드리지 않는다.
 */
export const useDashboardHandOvers = (courses: DashboardCourse[]): Record<number, HandOverRow[]> => {
  const targets = courses.filter((course) => course.handoverCount > 0)

  return useQueries({
    queries: targets.map((course) => ({
      queryKey: dashboardKeys.handOvers(course.historySeq, course.handoverCount),
      queryFn: () => fetchCourseHistoryHandOvers(course.historySeq),
    })),
    combine: (results) =>
      Object.fromEntries(
        results.flatMap((result, index) => (result.data ? [[targets[index].historySeq, result.data]] : []))
      ),
  })
}
