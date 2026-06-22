import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import axios, { AxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'
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

// 토큰 재발급 엔드포인트 — 401 분기에서 재귀 방지 위해 제외 대상.
const REFRESH_PATH = '/api/auth/refresh'

/**
 * 401 → refresh 재시도용 확장 config.
 * `_retry`로 동일 요청의 두 번째 401에서 재시도를 막아 무한루프 방지.
 */
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

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
    { timeout: 5000 }
  )
  const body = res.data
  if (!body || body.code !== 200 || !body.data) {
    throw new Error(body?.message ?? '토큰 재발급 실패')
  }
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
    const body = response.data as ApiResponse<unknown> | undefined
    const isApiResponse =
      body !== null &&
      typeof body === 'object' &&
      typeof (body as ApiResponse<unknown>).code === 'number' &&
      typeof (body as ApiResponse<unknown>).message === 'string' &&
      'data' in (body as ApiResponse<unknown>)

    if (!isApiResponse) {
      console.warn(response)
      throw new Error('알 수 없는 응답 형식')
    }

    if (body!.code !== 200) {
      throw new Error(body!.message)
    }

    response.data = body!.data
    return response
  },
  async (error: AxiosError) => {
    // 네트워크 실패 정규화
    if (!error.response) {
      return Promise.reject(new Error('네트워크 연결을 확인해주세요'))
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
        return Promise.reject(error)
      }
      try {
        const newAccess = await ensureRefresh()
        original._retry = true
        original.headers.set('Authorization', `Bearer ${newAccess}`)
        return api.request(original)
      } catch {
        finalizeAuthFailure()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
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
