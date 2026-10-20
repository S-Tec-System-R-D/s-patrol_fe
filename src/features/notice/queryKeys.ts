import type { NoticeListParams } from './types/notice'

/**
 * 공지사항 react-query 키 (`spec 026` T570).
 *
 * 규약은 `data-model.md` §8 그대로다(`courseHistoryKeys`·`pointHistoryKeys` 와 같은 모양):
 * 루트 문자열 1개 · **`siteSeq` 포함** · 필터는 객체 1개로 마지막.
 */
export const noticeKeys = {
  /** 목록 쿼리 전체의 접두사. ⚠️ 상세는 루트가 달라 **여기에 걸리지 않는다** */
  lists: ['notice-list'] as const,

  /**
   * 🔴 `siteSeq` 가 키에 없으면 사업장을 전환했을 때 **이전 사업장 공지가 그대로 보인다** —
   * `siteSeq` 는 URL 에 노출하지 않으므로(`spec 021` DoD #13) 키가 유일한 구분자다.
   */
  list: (params: NoticeListParams) => ['notice-list', params.siteSeq, params] as const,

  /** 🔴 `noticeSeq` 는 전역 유일이라 `siteSeq` 가 필요 없다(이력 상세와 같은 판단) */
  detail: (noticeSeq: number) => ['notice-detail', noticeSeq] as const,
}
