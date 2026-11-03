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
  pointHistory: (params: DashboardPointHistoryParams) =>
    ['dashboard-point-history', params.siteSeq, params] as const,
}
