import type { AssignmentHistoryParams, UserAssignmentHistoryParams } from './types/deployment'

/**
 * 배치관리 react-query 키 (`spec 039` T629 → `spec 042` T705 실측 API 로 교체).
 *
 * 🔴 **사업장 쿼리는 루트를 공유한다** — 승인·반려 한 번이 **요약 · 요청 목록 · 이력**을 모두 바꾼다(승인하면
 * 대기 -1 · 배치 온 +1 · 전입 이력 +1). 따로 두면 하나만 무효화하는 실수가 나고, 화면의 숫자끼리
 * 어긋난다. 그래서 `all(siteSeq)` 하나로 한 번에 무효화한다.
 *
 * 🔴 **근무자별 이력은 사업장이 없다**(`userSeq` 만) — `all(siteSeq)` 아래에 둘 수 없어 `user()` 접두사를
 * 따로 두고, 승인·반려가 **둘 다** 무효화한다.
 *
 * 규약 2(`data-model.md` §8) — **사업장을 키에 넣는다**(바꾸면 이전 사업장 숫자가 남는다).
 */
export const deploymentKeys = {
  /** 무효화 접두사 — 이 사업장의 배치 쿼리 전부 */
  all: (siteSeq: number) => ['deployment', siteSeq] as const,

  summary: (siteSeq: number) => ['deployment', siteSeq, 'summary'] as const,

  /** 배열 응답이라 페이지는 키에 없다 — 화면이 자른다 */
  requests: (siteSeq: number) => ['deployment', siteSeq, 'requests'] as const,

  returns: (siteSeq: number) => ['deployment', siteSeq, 'returns'] as const,

  history: (tab: 'in' | 'out', params: AssignmentHistoryParams) =>
    ['deployment', params.siteSeq, 'history', tab, params] as const,

  /** 무효화 접두사 — 근무자별 이력 전부 */
  user: () => ['deployment', 'user'] as const,

  userHistory: (params: UserAssignmentHistoryParams) =>
    ['deployment', 'user', params.userSeq, params] as const,
}
