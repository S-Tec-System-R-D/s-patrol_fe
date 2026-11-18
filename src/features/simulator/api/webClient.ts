import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { getSimConfig } from '../config'
import { toSimError } from './simError'

/**
 * 시뮬레이터 전용 **웹 API** 클라이언트 — 본사 계정으로 호출한다(`spec 082`).
 *
 * 🔴 **`src/lib/axios.ts` 를 쓰지 않는다.** 그 인스턴스는 `localStorage` 의 토큰을 붙이고 401 에서
 * 로그인 페이지로 보낸다 — 여기서 쓰면 다른 탭에 열어 둔 현장 화면의 로그인이 바뀐다.
 * 토큰은 **이 모듈의 변수에만** 둔다(새로고침하면 다시 로그인한다).
 */
const LOGIN_PATH = '/api/v1/Login/W/Login'

let token: string | null = null
let loginPromise: Promise<string> | null = null

const http = () => axios.create({ baseURL: getSimConfig().webApiBaseUrl, timeout: 15_000 })

const login = (): Promise<string> => {
  loginPromise ??= (async () => {
    const { adminId, adminPw } = getSimConfig()
    try {
      const res = await http().post<ApiResponse<{ accessToken: string }>>(LOGIN_PATH, {
        loginId: adminId,
        loginPw: adminPw,
      })
      token = res.data.data.accessToken
      return token
    } catch (error) {
      throw toSimError(error)
    } finally {
      loginPromise = null
    }
  })()
  return loginPromise
}

const send = async <T>(config: AxiosRequestConfig, accessToken: string): Promise<T> => {
  const res = await http().request<ApiResponse<T>>({
    ...config,
    headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
  })
  return res.data.data
}

/** 래퍼를 벗긴 `data` 를 돌려준다. 401 이면 다시 로그인해 **한 번만** 재시도한다 */
export const webRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    return await send<T>(config, token ?? (await login()))
  } catch (error) {
    const simError = toSimError(error)
    if (simError.status !== 401) throw simError
    token = null
    try {
      return await send<T>(config, await login())
    } catch (retryError) {
      throw toSimError(retryError)
    }
  }
}

/** 테스트용 — 모듈에 든 토큰을 비운다 */
export const resetWebSession = (): void => {
  token = null
  loginPromise = null
}
