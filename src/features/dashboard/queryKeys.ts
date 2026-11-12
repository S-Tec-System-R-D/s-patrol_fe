import type { CourseHistoryParams } from '@/features/course-history/types'

/**
 * 대시보드 react-query 키 (`spec 068` T1129). 규약은 `data-model.md` §8 그대로(`noticeKeys` 와 같은 모양).
 *
 * 🔴 **`siteSeq` 를 키에 넣는다** — 사업장을 전환하면 키가 바뀌어 새로 받는다. `siteSeq` 는 URL 에 없어
 * 키가 유일한 구분자다.
 */
export const dashboardKeys = {
  summary: (siteSeq: number) => ['dashboard-summary', siteSeq] as const,
  courses: (siteSeq: number) => ['dashboard-courses', siteSeq] as const,
  handOvers: (historySeq: number, handoverCount: number) =>
    ['dashboard-hand-overs', historySeq, handoverCount] as const,
  /** 최근 회차 100건(최근 종료 · 최근 미완료). 날짜가 키에 들어가 실시간 다시 받기는 앞부분으로 찾는다 */
  recentCourses: (siteSeq: number) => ['dashboard-recent-courses', siteSeq] as const,
  recentCourse: (params: CourseHistoryParams) =>
    ['dashboard-recent-courses', params.siteSeq, params] as const,
}
