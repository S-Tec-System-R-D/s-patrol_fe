/**
 * API 응답 SSOT 타입
 * 출처: docs/data-model.md §2-1 (1:1 일치)
 *
 * - 모든 **성공** 응답은 `ApiResponse<T>` 래퍼
 * - 목록: `ApiListResponse<T>` = `ApiResponse<PagedData<T>>`
 * - 상세: `ApiDetailResponse<T>` = `ApiResponse<T>`
 * - `code`는 **HTTP status code가 아니다** — 비즈니스/권한 코드. 로그인 성공은
 *   사이트+권한(본사 101/102/103, 현장 201/202), 일반 조회 성공은 200.
 * - **에러 응답은 래퍼가 아닐 수 있다** — ProblemDetails 또는 빈 body(401/403).
 *   docs/api-spec.md §3 참조. 에러는 HTTP status로 1차 분기한다.
 * - 요청은 `pageNumber`(1-based), **응답 필드는 `page`**
 */

/** 기본 API 응답 래퍼 */
export interface ApiResponse<T> {
  message: string
  data: T
  code: number
}

/**
 * 페이지네이션된 데이터.
 * 실측 구조는 **평면**이다(당초 `{ meta, data }` 중첩 설계 폐기).
 * `page`는 요청 파라미터 `pageNumber`와 이름이 다르다.
 */
export interface PagedData<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** 목록 API 응답 타입 */
export type ApiListResponse<T> = ApiResponse<PagedData<T>>

/** 상세 API 응답 타입 — 단일 객체 T */
export type ApiDetailResponse<T> = ApiResponse<T>
