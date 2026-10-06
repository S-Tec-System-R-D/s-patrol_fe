import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import axios, { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'
import { isApiResponse } from '@/lib/api/responseShape'
import { toApiError } from '@/lib/api/normalizeError'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth/tokens'
import { redirectToLogin } from '@/lib/auth/redirect'
import { notify } from '@/lib/notify'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * 토큰 재발급 엔드포인트 — 401 분기에서 재귀 방지 위해 제외 대상.
 *
 * ⚠️ 이 상수를 바꾸면 아래 `isRefreshRequest` 재귀 차단도 함께 따라와야 한다.
 * 차단이 옛 경로를 보면 재발급 요청의 401이 무한루프가 된다. 같은 상수를 참조해 자동 정합.
 *
 * MSW 핸들러·테스트가 같은 경로를 하드코딩하면 조용히 어긋난다(019에서 실제로 발생 —
 * 핸들러가 옛 경로에 걸려 재발급 실패 테스트가 우연히 통과했다). 그래서 export해 공유한다.
 */
export const REFRESH_PATH = '/api/v1/Login/W/sign/RefreshToken'

/**
 * 401 → refresh 재시도용 확장 config.
 * `_retry`로 동일 요청의 두 번째 401에서 재시도를 막아 무한루프 방지.
 */
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

/**
 * `_raw` — 래퍼 전체를 받기 위한 요청 옵션.
 *
 * 성공 응답은 기본적으로 `data`만 남기고 래퍼를 벗기는데, 그러면 `code`가 사라진다.
 * 로그인은 `code`(본사 1xx / 현장 2xx, 근무자 202 차단)로 분기해야 하므로 예외가 필요하다.
 *
 * 확정 수요는 **로그인·토큰 재발급 2곳뿐**이다. 범용 옵션으로 키우지 않는다.
 * 모듈 확장으로 선언해 호출부가 캐스팅 없이 `{ _raw: true }`를 넘길 수 있게 한다.
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    _raw?: boolean
  }
}

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
})

/**
 * 요청 인터셉터 — accessToken 존재 시 Authorization 헤더 자동 부착.
 * 토큰이 없으면 헤더 미부착 → 서버 401 → 응답 인터셉터의 refresh 흐름이 처리.
 */
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/**
 * single-flight refresh — 동시 401 폭주 시 refresh는 1회만.
 * 진행 중 Promise를 모듈 스코프에 보유하고 모든 401 콜백이 같은 Promise를 await.
 */
let refreshPromise: Promise<string> | null = null

const runRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('refreshToken 없음')
  }
  // 재귀 방지: 인터셉터를 거치지 않는 별도 axios 인스턴스로 호출.
  const res = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    `${BASE_URL}${REFRESH_PATH}`,
    { refreshToken },
    {
      timeout: 5000,
      // 실측상 재발급은 body의 refreshToken과 Bearer 헤더를 **둘 다** 요구한다.
      // docs/api-spec.md §1-3
      headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
    }
  )

  // 인터셉터를 타지 않는 호출이라 형식 검증을 직접 한다.
  // 성공 판정은 HTTP 2xx(여기까지 왔으면 2xx) + 토큰 존재 여부.
  // `code`로 판정하지 않는다 — 실측 재발급 성공 code는 **201**이라
  // 기존의 `code !== 200` 검사는 항상 실패했다.
  const body = res.data
  if (!isApiResponse(body) || !body.data?.accessToken) {
    throw new Error('토큰 재발급 실패')
  }

  // refreshToken은 회전하지 않는다(실측) — 응답값이 기존과 같아도 정상이다.
  setAccessToken(body.data.accessToken)
  setRefreshToken(body.data.refreshToken)
  return body.data.accessToken
}

/**
 * single-flight 진입점 — 진행 중 Promise가 있으면 공유, 없으면 새로 시작.
 * 종단(성공/실패)에서 Promise 슬롯을 비워 다음 만료 사이클을 새로 받는다.
 */
const ensureRefresh = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // blob 우회 — 파일 다운로드 응답은 unwrap 하지 않는다.
    if (response.config.responseType === 'blob') {
      return response
    }

    // ApiResponse 형식 검증 + 자동 unwrap
    if (!isApiResponse(response.data)) {
      console.warn(response)
      throw new Error('알 수 없는 응답 형식')
    }

    // `_raw` 요청은 래퍼째로 돌려준다 — `code`가 필요한 로그인·재발급용.
    if (response.config._raw) {
      return response
    }

    // 성공 판정은 **HTTP status 2xx 전담**이다. `code`로 판정하지 않는다.
    // 성공 code가 200(조회) / 101·102·103(본사 로그인) / 201·202(현장 로그인) /
    // 201(재발급)로 갈리므로, `code !== 200`을 실패로 보면 로그인이 전부 실패한다.
    // `code`는 해석하지 않고 통과시키고, 해석은 소비처(로그인 화면) 책임이다.
    // 근거: docs/api-spec.md §2 · spec 019 §3 비즈니스 규칙 1
    response.data = (response.data as ApiResponse<unknown>).data
    return response
  },
  async (error: AxiosError) => {
    // 네트워크 실패(응답 없음)도 `toApiError`가 같은 문구로 처리한다.
    if (!error.response) {
      return Promise.reject(toApiError(error))
    }

    const status = error.response.status
    const original = error.config as RetriableConfig | undefined

    // 401 분기 — refresh 흐름
    // 제외 조건:
    //   1) 원 요청 config가 없음(이론상 불가, 안전)
    //   2) /auth/refresh 자체의 401(재귀 차단)
    //   3) 이미 한 번 재시도한 요청(_retry === true) — 무한루프 차단
    const isRefreshRequest = original?.url?.includes(REFRESH_PATH) ?? false
    if (status === 401 && original && !isRefreshRequest && !original._retry) {
      // refreshToken이 아예 없으면 refresh 시도 없이 곧장 종료 처리.
      if (!getRefreshToken()) {
        finalizeAuthFailure()
        return Promise.reject(toApiError(error))
      }
      try {
        const newAccess = await ensureRefresh()
        original._retry = true
        original.headers.set('Authorization', `Bearer ${newAccess}`)
        return api.request(original)
      } catch {
        finalizeAuthFailure()
        return Promise.reject(toApiError(error))
      }
    }

    // 401 재발급 분기를 지나온 나머지 — 403 포함.
    // 403은 권한 부족이지 만료가 아니므로 재발급을 시도하지 않는다.
    // 서버가 403·401에 빈 body를 주므로(docs/api-spec.md §3-(C)) 본문 파싱은 하지 않는다.
    return Promise.reject(toApiError(error))
  }
)

/**
 * refresh 실패(또는 refreshToken 부재) 시 종료 처리.
 * - 토큰 클리어
 * - toast 1회(중복 호출 방지: 직전 호출 시점 기억)
 * - 영역별 로그인 페이지로 이동(?redirect=현재경로)
 *
 * single-flight 종단에서만 호출되도록 401 콜백이 한 번씩만 닿는다.
 * 같은 사이클 내 다중 호출 시 toast 중복을 막기 위해 시간 가드를 둠.
 */
let lastFailureAt = 0
const FAILURE_TOAST_GUARD_MS = 1000

function finalizeAuthFailure(): void {
  clearTokens()
  const now = Date.now()
  if (now - lastFailureAt > FAILURE_TOAST_GUARD_MS) {
    lastFailureAt = now
    notify.error('다시 로그인이 필요합니다')
    const currentPath = `${window.location.pathname}${window.location.search}`
    redirectToLogin(currentPath)
  }
}

export default api
