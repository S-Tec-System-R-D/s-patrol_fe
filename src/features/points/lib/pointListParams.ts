import type { PointListParams } from '../types'

/**
 * URL 쿼리스트링 ↔ `GetPointList` 서버 파라미터 변환.
 *
 * 검색·필터·페이지 상태는 URL에 둔다(`CLAUDE.md` B4). 서버가 `searchKey`·
 * `authMethod`·`useYn`·페이징을 **모두 제공**하므로 클라이언트 필터 함수는 만들지
 * 않는다 — 018이 `filterCourseHistory.ts` 로 그 길을 갔다가 확정 폐기했다
 * (`roadmap.md` §12 018 행 / `spec 022` §3 규칙 8).
 *
 * 🔴 **URL `page` 는 서버와 같은 1-based 로 둔다.** 그래서 URL↔서버 사이에는 변환이
 * 없고, **0-based 인 `AppPagination`(`pageIndex`) 경계 한 곳에서만** 변환한다
 * (`toPageIndex`/`toPageNumber`). 양쪽을 다 0-based 로 맞추면 URL 의 `page=0` 이
 * 1페이지를 뜻해 사용자에게 설명이 안 되고, 서버는 `pageNumber=0` 에 400 을 준다
 * (`api-spec.md` §1-5).
 *
 * 파싱 실패는 **던지지 않고 기본값으로 수렴**한다 — 손으로 고친 URL이 화면을
 * 깨뜨리지 않게 한다(`lib/dateRangeQuery.ts` 선례).
 */

/**
 * `AppSelect` 의 "전체" 센티넬. 이 값은 URL 에 남기지 않고 서버 파라미터에서도 뺀다.
 *
 * ⚠️ `features/patrol-zones/lib/courseHistoryOptions.ts:20` 에 같은 상수가 있다
 * (018). 지금은 **feature 로컬로 중복**을 둔다 — 두 화면이 서로를 import 하는 것보다
 * 1줄 중복이 낫다(A6). 세 번째 소비처가 생기면 `AppSelect` 옆으로 올리는 것을 검토한다.
 */
export const ALL_VALUE = 'ALL'

/** 서버 기본값과 동일(`api-spec.md` §1-5). 기본값에 의존하지 않고 명시 전송한다 */
export const DEFAULT_PAGE_SIZE = 20

/** URL 쿼리 키 — 전부 문자열이다(`useQueryParams` 는 raw string 을 준다) */
export interface PointListQuery {
  search?: string
  authMethod?: string
  useYn?: string
  page?: string
}

/** 비었거나 "전체"면 `undefined` — 키 자체를 보내지 않는다 */
const omitIfAll = (value?: string): string | undefined => {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '' || trimmed === ALL_VALUE) return undefined
  return trimmed
}

/** 정수로 읽히지 않으면 `undefined` (필터를 적용하지 않음) */
const parseIntegerFilter = (value?: string): number | undefined => {
  const raw = omitIfAll(value)
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  return Number.isInteger(parsed) ? parsed : undefined
}

/** `'true'`/`'false'` 만 인정한다. 그 외는 필터 미적용 */
const parseBooleanFilter = (value?: string): boolean | undefined => {
  const raw = omitIfAll(value)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

/** 1 미만·비정수·파싱 실패는 모두 1페이지로 수렴한다 */
export const parsePageNumber = (value?: string): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  return parsed
}

/** URL 쿼리 → 서버 파라미터 */
export const toPointListParams = (
  siteSeq: number,
  query: PointListQuery,
  pageSize: number = DEFAULT_PAGE_SIZE
): PointListParams => ({
  siteSeq,
  searchKey: omitIfAll(query.search),
  authMethod: parseIntegerFilter(query.authMethod),
  useYn: parseBooleanFilter(query.useYn),
  pageNumber: parsePageNumber(query.page),
  pageSize,
})

/**
 * 🔴 1-based ↔ 0-based 변환의 **유일한 자리**.
 * `AppPagination` 이 0-based `pageIndex` 를 쓰고 서버·URL 은 1-based `pageNumber` 다.
 */
export const toPageIndex = (pageNumber: number): number => pageNumber - 1
export const toPageNumber = (pageIndex: number): number => pageIndex + 1
