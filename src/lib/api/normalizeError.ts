import type { AxiosError } from 'axios'

import type { ApiResponse, ProblemDetails } from '@/types/api'
import { isApiResponse, isEmptyBody, isProblemDetails } from '@/lib/api/responseShape'

/**
 * 에러 응답 정규화.
 *
 * 서버가 **3가지 형태**로 에러를 주기 때문에(docs/api-spec.md §3) 호출부가
 * 매번 형태를 따질 수 없다. 어떤 형태로 오든 `message` 하나를 뽑아 준다.
 *
 * 특히 401·403은 **body가 비어 있다.** 파싱을 시도하지 않는다.
 */

export type ApiErrorKind =
  /** 응답 자체가 없음 (오프라인·타임아웃·CORS) */
  | 'network'
  /** (A) ApiResponse 래퍼 — 비즈니스 오류 */
  | 'wrapper'
  /** (B) ProblemDetails — 유효성 400, 서버 500 */
  | 'problem'
  /** (C) 빈 body — 401·403 */
  | 'empty'
  /** 어느 형태도 아님 */
  | 'unknown'

export interface NormalizedApiError {
  kind: ApiErrorKind
  /** 네트워크 실패면 null */
  status: number | null
  /** 사용자에게 그대로 보여줄 수 있는 문구 */
  message: string
  /** 원본 body — 디버깅·호출부 추가 분기용 */
  raw: unknown
}

const NETWORK_MESSAGE = '네트워크 연결을 확인해주세요'

/**
 * status별 기본 문구.
 * 서버가 메시지를 주지 않는 경우(특히 403 빈 body)에 쓴다.
 */
const defaultMessage = (status: number): string => {
  if (status === 401) return '다시 로그인이 필요합니다'
  if (status === 403) return '접근 권한이 없습니다'
  if (status === 404) return '요청한 대상을 찾을 수 없습니다'
  if (status >= 500) return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요'
  return '요청을 처리하지 못했습니다'
}

/**
 * ProblemDetails에서 메시지 추출.
 * `errors`는 `Record<string, string[]>`이라 키 순서에 의존한다. 첫 항목만 쓴다 —
 * 여러 필드 오류를 한 번에 보여주는 수요가 아직 없다. 필요해지면 `raw`로 접근한다.
 */
const fromProblemDetails = (body: ProblemDetails): string => {
  const firstFieldError = Object.values(body.errors ?? {})
    .flat()
    .find((text) => typeof text === 'string' && text.length > 0)

  return firstFieldError ?? body.detail ?? body.title ?? defaultMessage(body.status)
}

export const normalizeError = (error: AxiosError): NormalizedApiError => {
  // 응답이 아예 없으면 네트워크 문제다. body를 볼 것이 없다.
  if (!error.response) {
    return { kind: 'network', status: null, message: NETWORK_MESSAGE, raw: undefined }
  }

  const status = error.response.status
  const body = error.response.data

  if (isEmptyBody(body)) {
    return { kind: 'empty', status, message: defaultMessage(status), raw: body }
  }

  if (isApiResponse(body)) {
    const { message } = body as ApiResponse<unknown>
    return {
      kind: 'wrapper',
      status,
      message: message.length > 0 ? message : defaultMessage(status),
      raw: body,
    }
  }

  if (isProblemDetails(body)) {
    return { kind: 'problem', status, message: fromProblemDetails(body), raw: body }
  }

  return { kind: 'unknown', status, message: defaultMessage(status), raw: body }
}

/**
 * 인터셉터가 호출부로 던지는 에러.
 *
 * 정규화 결과를 그대로 reject하면 `instanceof Error`가 false가 되어
 * 기존 `error.message` 접근부와 에러 바운더리가 깨진다. `Error`를 상속해
 * `message`는 사용자 문구로, 세부 정보는 `detail`로 노출한다.
 */
export class ApiError extends Error {
  readonly detail: NormalizedApiError

  constructor(detail: NormalizedApiError) {
    super(detail.message)
    this.name = 'ApiError'
    this.detail = detail
  }

  get kind(): ApiErrorKind {
    return this.detail.kind
  }

  get status(): number | null {
    return this.detail.status
  }
}

/** `AxiosError` → 호출부로 던질 `ApiError` */
export const toApiError = (error: AxiosError): ApiError => new ApiError(normalizeError(error))
