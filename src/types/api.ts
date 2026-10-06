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

/**
 * ASP.NET ProblemDetails (RFC 9110).
 * **`ApiResponse` 래퍼가 아니다** — `message` 필드가 없다.
 * 유효성 오류(400)·서버 오류(500)가 이 형태로 내려온다. docs/api-spec.md §3-(B)
 */
export interface ProblemDetails {
  /** 필드명 → 메시지 배열. 유효성 오류에만 존재 */
  errors?: Record<string, string[]>
  type: string
  title: string
  status: number
  detail?: string
  traceId: string
}

/**
 * 로그인 성공 `code` 사전. docs/api-spec.md §2-1
 *
 * ⚠️ **권한 판단의 SSOT가 아니다.** 권한은 JWT `role` 클레임으로 판단한다(CLAUDE.md B4).
 * 이 값은 로그인 직후 **1회성 라우팅 힌트**로만 쓰고 저장하지 않는다.
 * - `1xx` → 본사(`/admin/*`), `2xx` → 현장(`/*`)
 * - `202`(근무자)는 WEB 접근 불가 대상 — 토큰을 저장하지 않고 차단한다
 */
export const LOGIN_CODE = {
  SYSTEM: 101,
  MASTER: 102,
  MANAGER: 103,
  FIELD_MANAGER: 201,
  WORKER: 202,
} as const

/** 본사 사이트로 보낼 로그인 code인가 */
export const isAdminLoginCode = (code: number): boolean => code >= 100 && code < 200

/** 현장 사이트로 보낼 로그인 code인가 */
export const isServiceLoginCode = (code: number): boolean => code >= 200 && code < 300

// 성공/실패를 `code`로 판정하는 헬퍼는 의도적으로 두지 않는다.
// 성공 판정은 HTTP status 2xx 전담(spec 019 §3 비즈니스 규칙 1).
// 성공 code가 200/101/201로 갈리므로 code 기반 판정은 로그인을 실패로 만든다.
