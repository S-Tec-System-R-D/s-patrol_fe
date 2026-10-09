import type { PointHistoryParams, PointListParams } from './types'

/**
 * 순찰지점 react-query 키 SSOT.
 *
 * 🔴 **본 파일이 프로젝트의 첫 `queryKey` 규약이다.** `spec 022` 착수 시점에
 * `useQuery`·`useMutation`·`queryKey` 사용처가 **0건**이었다(004가 패키지와
 * `QueryClientProvider`만 깔아 둔 상태). 따라서 아래 모양이 `spec 023~026`
 * (순찰코스·지점이력·코스이력·공지)의 사실상 컨벤션이 된다.
 *
 * **규약**
 * 1. 도메인 루트는 문자열 리터럴 1개로 시작한다 — 목록 `'points'`, 상세 `'point'`.
 * 2. 🔴 **스코프 값(`siteSeq`)을 키에 반드시 포함한다.** 빠지면 사업장을 전환했을 때
 *    같은 키에 다른 사업장 데이터가 캐시돼 **이전 사업장 목록이 그대로 보인다.**
 *    `siteSeq`는 URL에 노출하지 않으므로(`spec 021` DoD #13) 키가 유일한 구분자다.
 * 3. 필터·페이지 파라미터는 **객체 1개로** 마지막에 둔다. 키를 나열하면 파라미터가
 *    늘 때마다 키 모양이 바뀐다.
 * 4. 변경 성공 시 `invalidateQueries({ queryKey: pointKeys.lists })` 로 목록 전체를,
 *    수정은 `pointKeys.detail(pointSeq)` 를 **함께** 무효화한다.
 */

export const pointKeys = {
  /**
   * 목록 쿼리 전체의 접두사. 무효화 단위다.
   *
   * ⚠️ 이름이 `all` 이 아니라 `lists` 인 이유: 상세는 루트가 `'point'` 로 달라
   * 이 접두사에 **걸리지 않는다**. `all` 로 두면 "전부 무효화된다"고 오해한다.
   */
  lists: ['points'] as const,

  /**
   * 목록 쿼리 키. `PointListParams` 를 통째로 받아 `siteSeq` 누락을 **타입으로 막는다**
   * (규약 2) — 호출부가 스코프를 빼먹을 여지를 없앴다.
   */
  list: (params: PointListParams) => ['points', params.siteSeq, params] as const,

  /** 상세 쿼리 키. 수정 후 이 키만 따로 무효화한다 */
  detail: (pointSeq: number) => ['point', pointSeq] as const,

  /**
   * 지점 순찰이력 키(027).
   *
   * 루트를 `'point-history'` 로 **따로 둔다** — 지점을 수정·삭제해도 이력은 바뀌지
   * 않으므로 `lists`·`detail` 무효화에 **딸려 들어가면 안 된다**(불필요한 재조회).
   * 규약 2대로 스코프(`siteSeq`)를 포함하고 파라미터 객체를 마지막에 둔다.
   */
  history: (params: PointHistoryParams) =>
    ['point-history', params.siteSeq, params] as const,
}
