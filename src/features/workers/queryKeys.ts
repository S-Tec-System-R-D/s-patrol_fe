import type { UserListParams } from './types/user'

/**
 * 근무자 react-query 키 (`spec 038` T599).
 *
 * 규약은 `data-model.md` §8 그대로다(026 `noticeKeys` 와 같은 모양): 루트 문자열 1개 ·
 * **사업장 포함** · 필터는 객체 1개로 마지막.
 */
export const userKeys = {
  /** 목록 쿼리 전체의 접두사. ⚠️ 상세는 루트가 달라 **여기에 걸리지 않는다** */
  lists: ['user-list'] as const,

  /** 🔴 사업장(`siteId`)이 키에 없으면 사업장을 바꿨을 때 **이전 사업장 사람이 그대로 보인다** */
  list: (params: UserListParams) => ['user-list', params.siteId, params] as const,

  /** 🔴 `userSeq` 는 전역 유일이라 사업장이 필요 없다 */
  detail: (userSeq: number) => ['user-detail', userSeq] as const,
}
