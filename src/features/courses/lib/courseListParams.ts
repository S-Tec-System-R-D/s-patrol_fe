import { ALL_VALUE } from '@/lib/listQuery'
import type { CourseListParams } from '../types'

/**
 * URL 쿼리스트링 ↔ `GetCourseList` 서버 파라미터 변환.
 *
 * 🔴 **지점의 `lib/pointListParams.ts` 와 같은 모양이다**(027 자산). 필터 종류만 다르다
 * (`authMethod` → `switchYn`·`status`). 공용으로 올리지 않는 이유는
 * `spec 023` T373(공용 셸 승격 판단)에서 함께 결론 낸다 — 지금 섣불리 추상화하면
 * 파라미터 집합이 다른 세 번째 도메인에서 깨진다(A6).
 *
 * 🔴 **URL `page` 는 서버와 같은 1-based 로 둔다.** 변환은 0-based 인
 * `AppPagination`(`pageIndex`) 경계 한 곳에서만 한다. 양쪽을 0-based 로 맞추면 URL 의
 * `page=0` 이 1페이지를 뜻해 설명이 안 되고, 서버는 `pageNumber=0` 에 400 을 준다.
 *
 * 파싱 실패는 **던지지 않고 기본값으로 수렴**한다 — 손으로 고친 URL 이 화면을 깨뜨리지
 * 않게 한다.
 */

/**
 * ✅ **공용으로 올렸다**(`spec 036` T493, 사용자 결정 2026-10-16) — 네 번째 사본이
 * 생기려 해서다. 🔴 **import 한 뒤 re-export 한다** — `export { X } from '...'` 만 쓰면
 * 이 파일의 로컬 스코프에 바인딩되지 않아 아래 `omitIfAll` 이 깨진다.
 */
export { ALL_VALUE }

/** 서버 기본값과 동일(`api-spec.md` §1-5). 기본값에 의존하지 않고 명시 전송한다 */
export const DEFAULT_PAGE_SIZE = 20

/** URL 쿼리 키 — 전부 문자열이다(`useQueryParams` 는 raw string 을 준다) */
export interface CourseListQuery {
  search?: string
  useYn?: string
  switchYn?: string
  /** 🔴 URL 키는 `status`, 서버 파라미터는 `courseStatus` 다 */
  status?: string
  page?: string
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

/**
 * URL 쿼리 → 서버 파라미터.
 *
 * ⚠️ `courseStatus` 는 **값 체계가 불완전하다**(테스트 DB 에 `0` 만 존재, OQ-3). 그래서
 * 여기서는 **정수면 그대로 통과**시키고 사전으로 검증하지 않는다 — 모르는 코드를
 * 우리가 막으면 서버에 있는 상태를 걸러 버린다(A1).
 */
export const toCourseListParams = (
  siteSeq: number,
  query: CourseListQuery,
  pageSize: number = DEFAULT_PAGE_SIZE
): CourseListParams => ({
  siteSeq,
  searchKey: omitIfAll(query.search),
  useYn: parseBooleanFilter(query.useYn),
  switchYn: parseBooleanFilter(query.switchYn),
  courseStatus: parseIntegerFilter(query.status),
  pageNumber: parsePageNumber(query.page),
  pageSize,
})

/**
 * 🔴 1-based ↔ 0-based 변환의 **유일한 자리**.
 * `AppPagination` 이 0-based `pageIndex` 를 쓰고 서버·URL 은 1-based `pageNumber` 다.
 */
export const toPageIndex = (pageNumber: number): number => pageNumber - 1
export const toPageNumber = (pageIndex: number): number => pageIndex + 1
