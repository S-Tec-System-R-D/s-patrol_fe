import axios, { type AxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { getSimConfig } from '../config'
import { toSimError } from './simError'

/**
 * 시뮬레이터 전용 **앱(모바일) API** 클라이언트 (`spec 082`).
 *
 * 근무자 · 현장관리자 **여러 명의 토큰을 동시에** 든다 — 교대 시뮬은 두 근무자가 번갈아 호출한다.
 * 호출마다 "누구로 부를지"(`loginId`)를 넘긴다. 토큰은 메모리에만 둔다.
 *
 * 프록시를 타지 않고 앱 서버를 직접 부른다(CORS 허용 출처 — `docs/app-api-spec.md` §1-7).
 */
const LOGIN_PATH = '/api/v1/Login/M/Login'

const tokens = new Map<string, string>()
const logins = new Map<string, Promise<string>>()

const http = () => axios.create({ baseURL: getSimConfig().appApiBaseUrl, timeout: 15_000 })

/**
 * 그 계정의 토큰을 돌려준다(없으면 로그인한다). 같은 계정의 동시 로그인은 한 번으로 합친다.
 * 비밀번호는 공통 비밀번호(`VITE_SIM_WORKER_PW`)다 — 틀리면 400 래퍼가 `SimApiError` 로 온다.
 */
export const loginApp = (loginId: string): Promise<string> => {
  const cached = tokens.get(loginId)
  if (cached) return Promise.resolve(cached)

  let pending = logins.get(loginId)
  if (!pending) {
    pending = (async () => {
      try {
        const res = await http().post<ApiResponse<{ accessToken: string }>>(LOGIN_PATH, {
          loginId,
          loginPw: getSimConfig().workerPw,
        })
        const accessToken = res.data.data.accessToken
        tokens.set(loginId, accessToken)
        return accessToken
      } catch (error) {
        throw toSimError(error)
      } finally {
        logins.delete(loginId)
      }
    })()
    logins.set(loginId, pending)
  }
  return pending
}

const send = async <T>(config: AxiosRequestConfig, accessToken: string): Promise<T> => {
  const res = await http().request<ApiResponse<T>>({
    ...config,
    headers: { ...config.headers, Authorization: `Bearer ${accessToken}` },
  })
  return res.data.data
}

/**
 * `loginId` 계정으로 앱 API 를 부르고 래퍼를 벗긴 `data` 를 돌려준다.
 * 401 이면 그 계정으로 다시 로그인해 **한 번만** 재시도한다(재발급 API 는 쓰지 않는다).
 */
export const appRequest = async <T>(loginId: string, config: AxiosRequestConfig): Promise<T> => {
  try {
    return await send<T>(config, await loginApp(loginId))
  } catch (error) {
    const simError = toSimError(error)
    if (simError.status !== 401) throw simError
    tokens.delete(loginId)
    try {
      return await send<T>(config, await loginApp(loginId))
    } catch (retryError) {
      throw toSimError(retryError)
    }
  }
}

/** 테스트용 — 든 토큰을 모두 비운다 */
export const resetAppSessions = (): void => {
  tokens.clear()
  logins.clear()
}
