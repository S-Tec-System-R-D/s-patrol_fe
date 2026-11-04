import type { CourseHistoryParams } from '@/features/course-history/types'

import type { DashboardPointHistoryParams } from './api/getDashboardPointHistory'

/**
 * 대시보드 react-query 키 (`spec 068` T1129). 규약은 `data-model.md` §8 그대로(`noticeKeys` 와 같은 모양).
 *
 * 🔴 **`siteSeq` 를 키에 넣는다** — 사업장을 전환하면 키가 바뀌어 새로 받는다. `siteSeq` 는 URL 에 없어
 * 키가 유일한 구분자다.
 */
export const dashboardKeys = {
  summary: (siteSeq: number) => ['dashboard-summary', siteSeq] as const,
  courses: (siteSeq: number) => ['dashboard-courses', siteSeq] as const,
  /** 최근 기록 2번 호출을 한꺼번에 다시 받을 때(`spec 069` 실시간) — 아래 키의 앞부분 */
  pointHistories: (siteSeq: number) => ['dashboard-point-history', siteSeq] as const,
  pointHistory: (params: DashboardPointHistoryParams) =>
    ['dashboard-point-history', params.siteSeq, params] as const,
  /** 날짜가 키에 들어가 실시간 다시 받기는 앞부분으로 찾는다 */
  finishedCourses: (siteSeq: number) => ['dashboard-finished-courses', siteSeq] as const,
  finishedCourse: (params: CourseHistoryParams) =>
    ['dashboard-finished-courses', params.siteSeq, params] as const,
}
