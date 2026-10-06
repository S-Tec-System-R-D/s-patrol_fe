import type { ApiResponse, ProblemDetails } from '@/types/api'

/**
 * 응답 본문 형태 판별.
 *
 * 서버는 **3가지 형태**로 응답한다(docs/api-spec.md §3).
 * - (A) `ApiResponse` 래퍼 — 성공 전부 + 비즈니스 오류
 * - (B) ProblemDetails — 유효성 400, 서버 500. `message` 없음
 * - (C) 빈 body — 401(토큰 없음·무효), 403(권한 없음)
 *
 * 세 함수 모두 **어떤 입력에도 throw하지 않는다.** 빈 body를 파싱하려다
 * 터지는 것이 이 모듈이 막으려는 사고다.
 */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * (A) `ApiResponse` 래퍼인가.
 * 판정 기준은 기존 `axios.ts` 인라인 검사에서 그대로 옮겼다 — 기준을 바꾸지 않았다.
 */
export const isApiResponse = (body: unknown): body is ApiResponse<unknown> =>
  isPlainObject(body) &&
  typeof body.code === 'number' &&
  typeof body.message === 'string' &&
  'data' in body

/**
 * (B) ProblemDetails인가.
 * `title` + `status`만으로 판정한다. `type`·`traceId`는 서버 구현이 바뀌어도
 * 깨지지 않도록 판정에 쓰지 않는다.
 */
export const isProblemDetails = (body: unknown): body is ProblemDetails =>
  isPlainObject(body) && typeof body.title === 'string' && typeof body.status === 'number'

/**
 * (C) 빈 body인가. 401·403이 여기 걸린다.
 * 공백만 있는 문자열도 빈 것으로 본다.
 */
export const isEmptyBody = (body: unknown): boolean =>
  body === null ||
  body === undefined ||
  (typeof body === 'string' && body.trim().length === 0)
