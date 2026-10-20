import {
  clampPageSize,
  omitIfAll,
  orderRange,
  parseIntegerFilter,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import type { NoticeListParams } from '../types/notice'

/**
 * URL 쿼리스트링 ↔ `GetNoticeList` 서버 파라미터 변환 (`spec 026` T569).
 *
 * 🔴 **036·037 의 이력 변환과 같은 규약이다** — `pageSize` **상한 100** · 페이지 **1-based** ·
 * **빈 값은 키를 뺀다** · 기간은 **순서를 보장**(뒤집히면 서버가 `200` + 0건) · 파싱 실패는
 * **던지지 않고 기본값으로 수렴**.
 *
 * 🔴 **헬퍼를 다시 만들지 않는다** — `course-history` 의 것을 가져온다. 사본을 만들면
 * "100 이 상한" 같은 규약이 두 곳에서 갈린다(`spec 027` 이 200 을 보내 장애가 빈 상태로
 * 읽혔던 선례).
 */

/** URL 쿼리 키 — 전부 문자열이다(`useQueryParams` 는 raw string 을 준다) */
export interface NoticeQuery {
  /** 키워드 검색 → `keyword` */
  q?: string
  /** `yyyy-MM-dd` */
  from?: string
  to?: string
  page?: string
  size?: string
}

export const toNoticeListParams = (siteSeq: number, query: NoticeQuery): NoticeListParams => ({
  siteSeq,
  ...orderRange(query.from, query.to),
  keyword: omitIfAll(query.q),
  pageNumber: parsePageNumber(query.page),
  pageSize: clampPageSize(parseIntegerFilter(query.size)),
})
