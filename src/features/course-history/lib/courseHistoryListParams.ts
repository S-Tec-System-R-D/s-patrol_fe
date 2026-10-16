import { ALL_VALUE } from '@/lib/listQuery'
import type { CourseHistoryParams } from '../types'

/**
 * URL 쿼리스트링 ↔ `GetCourseHistory` 서버 파라미터 변환 (`spec 036` T493).
 *
 * 🔴 **`courses/lib/courseListParams.ts` 와 같은 모양이다**(022→027→023 자산). 필터
 * 종류만 다르다: 기간(`fromDt`·`toDt`) · 코스(`courseSeq`) · 결과(`eventType`) ·
 * 순찰자명(`userName`). 변환 함수를 공용으로 올리지 않는 이유는 `lib/listQuery.ts` 머리말에.
 *
 * 🔴 **URL `page` 는 서버와 같은 1-based 로 둔다.** 0-based 변환은 `AppPagination` 경계
 * 한 곳에서만 한다(`courseListParams.ts` 의 `toPageIndex`/`toPageNumber` 를 쓴다 —
 * 같은 함수를 다시 만들지 않는다).
 *
 * 파싱 실패는 **던지지 않고 기본값으로 수렴**한다 — 손으로 고친 URL 이 화면을 깨뜨리지
 * 않게 한다.
 */

export { ALL_VALUE }

/**
 * 🔴🔴 **`pageSize` 상한은 100 이다. 여기서 막는다.**
 *
 * `101` 이상을 보내면 `HTTP 400` + `{ message: '페이지 사이즈는 1~100 사이여야 합니다.' }`
 * 다(`api-spec.md` §1-5). ⚠️ **`spec 027` 이 `pageSize=200` 을 보내고 있었고**, 실서버에서
 * 조회가 통째로 400 이었는데 화면에는 **"순찰 기록이 없습니다"** 가 떴다 — **장애가 빈
 * 상태로 읽혔다.** mock 이 200 을 받아 줘 dev 에서는 드러나지 않았다.
 *
 * 🔴 그래서 **상한을 넘기는 경로를 타입이 아니라 함수로 막는다** — 호출부가 숫자를
 * 직접 넘기는 자리가 많고, 넘겨도 조용히 깎이는 것이 400 보다 낫다.
 */
export const MAX_PAGE_SIZE = 100

/** 목록 기본 행 수. 서버 기본값과 동일하지만 **명시 전송**한다 */
export const DEFAULT_PAGE_SIZE = 20

/** 🔴 상한을 넘기면 깎는다. 1 미만·비정수는 기본값으로 수렴 */
export const clampPageSize = (value?: number): number => {
  if (!Number.isInteger(value) || (value as number) < 1) return DEFAULT_PAGE_SIZE
  return Math.min(value as number, MAX_PAGE_SIZE)
}

/** URL 쿼리 키 — 전부 문자열이다(`useQueryParams` 는 raw string 을 준다) */
export interface CourseHistoryQuery {
  /** `yyyy-MM-dd` */
  from?: string
  to?: string
  /** 코스 필터 — `courseSeq` */
  course?: string
  /** 결과 필터 — 코스 사전(`eventType`): 0 진행중 / 1 완료 / 2 미완료 */
  result?: string
  /** 순찰자명 부분 검색. 🔴 드롭다운이 아니라 **텍스트**다 — 현장 계정은 `UserList` 가 403 */
  user?: string
  page?: string
  size?: string
}

/** 비었거나 "전체" 면 `undefined` — 키 자체를 보내지 않는다 */
const omitIfAll = (value?: string): string | undefined => {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '' || trimmed === ALL_VALUE) return undefined
  return trimmed
}

/** 정수로 읽히지 않으면 `undefined` (필터 미적용) */
const parseIntegerFilter = (value?: string): number | undefined => {
  const raw = omitIfAll(value)
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  return Number.isInteger(parsed) ? parsed : undefined
}

/** 1 미만·비정수·파싱 실패는 모두 1페이지로 수렴한다 */
export const parsePageNumber = (value?: string): number => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  return parsed
}

/** `yyyy-MM-dd` 형태만 인정한다. 그 외는 필터 미적용 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const parseDate = (value?: string): string | undefined => {
  const raw = omitIfAll(value)
  if (raw === undefined || !DATE_PATTERN.test(raw)) return undefined
  return raw
}

/**
 * 🔴🔴 **기간의 순서를 보장한다.**
 *
 * `from > to` 를 보내면 서버는 **에러가 아니라 `200` + 0건**을 준다(실측, `spec 023`).
 * 즉 뒤집힌 구간은 화면에 **"이력이 없습니다"** 로 보이고, 사용자는 날짜를 잘못 골랐다는
 * 것을 알 수 없다. 그래서 **구간을 만드는 쪽이 순서를 보장한다** — 뒤집혀 들어오면 swap 한다.
 *
 * ⚠️ 한쪽만 있으면 그대로 둔다(열린 구간). 서버가 한쪽만으로도 동작한다.
 */
export const orderRange = (
  from?: string,
  to?: string
): { fromDt?: string; toDt?: string } => {
  const fromDt = parseDate(from)
  const toDt = parseDate(to)
  if (fromDt !== undefined && toDt !== undefined && fromDt > toDt) {
    return { fromDt: toDt, toDt: fromDt }
  }
  return { fromDt, toDt }
}

/**
 * URL 쿼리 → 서버 파라미터.
 *
 * ⚠️ `eventType` 은 **코스 사전**(`0`·`1`·`2`)이다. 지점 사전(`0~4`)을 넣으면 뜻이 달라진다
 * (`2` 가 코스에서는 `미완료`, 지점에서는 `순찰제외`) — `api-spec.md` §4.
 * 🔴 다만 **사전으로 검증하지 않고 정수면 통과**시킨다. 모르는 코드를 우리가 막으면
 * 서버에 있는 상태를 걸러 버린다(A1 — `courseListParams.ts` 의 `courseStatus` 와 같은 판단).
 */
export const toCourseHistoryListParams = (
  siteSeq: number,
  query: CourseHistoryQuery
): CourseHistoryParams => ({
  siteSeq,
  ...orderRange(query.from, query.to),
  courseSeq: parseIntegerFilter(query.course),
  eventType: parseIntegerFilter(query.result),
  userName: omitIfAll(query.user),
  pageNumber: parsePageNumber(query.page),
  pageSize: clampPageSize(parseIntegerFilter(query.size)),
})
