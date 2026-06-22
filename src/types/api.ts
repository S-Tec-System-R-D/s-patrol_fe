/**
 * API 응답 SSOT 타입
 * 출처: docs/data-model.md §2-1 (1:1 일치)
 *
 * - 모든 응답은 `ApiResponse<T>` 래퍼
 * - 목록: `ApiListResponse<T>` = `ApiResponse<PagedData<T>>`
 * - 상세: `ApiDetailResponse<T>` = `ApiResponse<T>`
 * - `code`는 HTTP status code를 그대로 사용 (성공 200, 실패 4xx/5xx)
 * - `pageNumber`는 1-based
 */

/** 기본 API 응답 래퍼 */
export interface ApiResponse<T> {
  message: string
  data: T
  code: number
}

/** 페이지네이션 메타 정보 */
export interface PaginationMeta {
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** 페이지네이션된 데이터 (배열) */
export interface PagedData<T> {
  meta: PaginationMeta
  data: T[]
}

/** 목록 API 응답 타입 */
export type ApiListResponse<T> = ApiResponse<PagedData<T>>

/** 상세 API 응답 타입 — 단일 객체 T */
export type ApiDetailResponse<T> = ApiResponse<T>
