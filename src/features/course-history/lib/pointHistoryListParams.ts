import type { PointHistoryParams } from '../types'
import {
  ALL_VALUE,
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  omitIfAll,
  orderRange,
  parseIntegerFilter,
  parsePageNumber,
} from './courseHistoryListParams'

/**
 * URL 쿼리스트링 ↔ `GetPointHistory` 서버 파라미터 변환 (`spec 037` T531).
 *
 * 🔴 **`courseHistoryListParams.ts` 와 같은 모양이다.** 036 이 코스 쪽에서 세운 규약을
 * 그대로 승계한다 — `pageSize` **상한 100** · 페이지 **1-based** · **빈 값은 키를 뺀다** ·
 * 파싱 실패는 **던지지 않고 기본값으로 수렴**(손으로 고친 URL 이 화면을 깨뜨리지 않게).
 *
 * 🔴 **헬퍼를 다시 만들지 않는다** — `clampPageSize`·`parsePageNumber`·`orderRange`·
 * `omitIfAll`·`parseIntegerFilter` 를 이웃 파일에서 가져온다. 사본을 만들면 "100 이 상한"
 * 같은 규약이 두 곳에서 갈린다(`spec 027` 이 200 을 보내 **장애가 빈 상태로 읽혔던** 선례).
 *
 * **필터 집합만 다르다**: 기간(`fromDt`·`toDt`) · 코스(`courseSeq`) · 인증수단(`authMethod`) ·
 * 결과(`status`) · 순찰자명(`userName`).
 */

export { ALL_VALUE, clampPageSize, DEFAULT_PAGE_SIZE, parsePageNumber }

/** URL 쿼리 키 — 전부 문자열이다(`useQueryParams` 는 raw string 을 준다) */
export interface PointHistoryQuery {
  /** `yyyy-MM-dd` */
  from?: string
  to?: string
  /** 코스 필터 — `courseSeq` */
  course?: string
  /** 인증수단 필터 — `AUTH_METHOD`(9 QR / 10 NFC) */
  auth?: string
  /**
   * 결과 필터 — **지점 사전** `status`.
   *
   * 🔴 **선택지는 `3 미완료`·`4 완료` 2종뿐이다.** 뱃지는 5종이지만 그중 `이상없음`↔
   * `순찰기록` 은 `hasMemo` **파생**이라 서버에 보낼 값이 없고, `시간초과` 는 `overTimeYn`
   * **독립 축**이며, `순찰제외`(2) 는 전 사업장 **0건**이다(`api-spec.md` §4 분포표).
   */
  result?: string
  /** 순찰자명 부분 검색. 🔴 드롭다운이 아니라 **텍스트** — 현장 계정은 `UserList` 가 403 */
  user?: string
  page?: string
  size?: string
}

/**
 * URL 쿼리 → 서버 파라미터.
 *
 * 🔴 **`status`·`authMethod` 를 사전으로 검증하지 않고 정수면 통과**시킨다. 모르는 코드를
 * 우리가 막으면 서버에 있는 상태를 걸러 버린다(A1 — 코스 쪽 `eventType` 과 같은 판단).
 *
 * ⚠️ **`pointSeq` 를 받지 않는다.** 목록은 사업장 전체를 보는 화면이고, `pointSeq` 로
 * 좁히는 쪽(지점 상세 · 지점 인증 상세)은 URL 쿼리가 아니라 **라우트 파라미터**에서 온다.
 */
export const toPointHistoryListParams = (
  siteSeq: number,
  query: PointHistoryQuery
): PointHistoryParams => ({
  siteSeq,
  ...orderRange(query.from, query.to),
  courseSeq: parseIntegerFilter(query.course),
  authMethod: parseIntegerFilter(query.auth),
  status: parseIntegerFilter(query.result),
  userName: omitIfAll(query.user),
  pageNumber: parsePageNumber(query.page),
  pageSize: clampPageSize(parseIntegerFilter(query.size)),
})
