import { AxiosError } from 'axios'
import { isApiResponse, isProblemDetails } from '@/lib/api/responseShape'

/**
 * 시뮬레이터가 보이는 오류 — **서버가 준 것을 그대로** 로그에 싣는다(`spec 082`).
 *
 * 화면용 문구로 다듬지 않는다. 이 도구의 목적이 "서버가 뭐라고 답했는지 보는 것"이라
 * HTTP 상태와 서버 문구를 함께 남긴다. 응답 종류는 `docs/app-api-spec.md` §1-5.
 */
export class SimApiError extends Error {
  /** HTTP 상태. 응답이 없으면(네트워크 · CORS) `null` */
  readonly status: number | null
  readonly body: unknown

  constructor(status: number | null, message: string, body: unknown) {
    super(message)
    this.name = 'SimApiError'
    this.status = status
    this.body = body
  }
}

const messageOf = (status: number, body: unknown): string => {
  // (A) 래퍼 — 비즈니스 오류 · 토큰 없음
  if (isApiResponse(body)) return body.message
  // (B) ProblemDetails — 유효성 400 은 필드별 문구, 500 은 detail
  if (isProblemDetails(body)) {
    const first = body.errors ? Object.values(body.errors)[0]?.[0] : undefined
    return first ?? body.detail ?? body.title
  }
  // (C) 빈 body — 권한 없음 403 등
  return `HTTP ${status} (본문 없음)`
}

export const toSimError = (error: unknown): SimApiError => {
  if (error instanceof SimApiError) return error
  if (error instanceof AxiosError) {
    if (!error.response) {
      return new SimApiError(null, '서버에 닿지 않습니다 (네트워크 · CORS)', null)
    }
    const { status, data } = error.response
    return new SimApiError(status, messageOf(status, data), data)
  }
  return new SimApiError(null, error instanceof Error ? error.message : String(error), null)
}
