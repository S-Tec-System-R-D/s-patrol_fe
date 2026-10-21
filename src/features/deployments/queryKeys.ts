import type { DeploymentHistoryParams, DeploymentRequestListParams } from './types/deployment'

/**
 * 배치관리 react-query 키 (`spec 039` T629).
 *
 * 🔴 **세 쿼리가 루트를 공유한다** — 승인·거부 한 번이 **요약 · 요청 목록 · 이력**을 모두 바꾼다(승인하면
 * 대기 -1 · 배치 온 +1 · 전입 이력 +1). 따로 두면 하나만 무효화하는 실수가 나고, 화면의 숫자끼리
 * 어긋난다. 그래서 `all(siteSeq)` 하나로 셋을 한 번에 무효화한다.
 *
 * 규약 2(`data-model.md` §8) — **사업장을 키에 넣는다**(바꾸면 이전 사업장 숫자가 남는다).
 */
export const deploymentKeys = {
  /** 무효화 접두사 — 이 사업장의 배치 쿼리 전부 */
  all: (siteSeq: number) => ['deployment', siteSeq] as const,

  summary: (siteSeq: number) => ['deployment', siteSeq, 'summary'] as const,

  requests: (params: DeploymentRequestListParams) =>
    ['deployment', params.siteSeq, 'requests', params] as const,

  /** 복귀 요청 — 승인하면 이력(전출)이 바뀌므로 같은 루트 아래 둔다(T659) */
  returns: (params: DeploymentRequestListParams) =>
    ['deployment', params.siteSeq, 'returns', params] as const,

  history: (params: DeploymentHistoryParams) =>
    ['deployment', params.siteSeq, 'history', params] as const,
}
