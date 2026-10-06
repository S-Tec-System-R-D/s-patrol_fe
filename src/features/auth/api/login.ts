import api from '@/lib/axios'
import type { ApiResponse } from '@/types/api'
import type { LoginFormData } from '@/features/auth/form/schema'

/**
 * 로그인 API.
 *
 * `POST /api/v1/Login/W/Login` — **`sign` 없는 유일한 엔드포인트**(인증 불필요, `api-spec.md` §1-1).
 * 응답 `data`에는 토큰 2개만 들어 있고 사용자 정보는 없다. 사용자 정보는 토큰 클레임에서 꺼낸다.
 */

const LOGIN_PATH = '/api/v1/Login/W/Login'

interface LoginTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse extends LoginTokens {
  /** 사이트·권한을 함께 나타내는 비즈니스 코드. HTTP status가 아니다(`api-spec.md` §2-1) */
  code: number
}

/**
 * 🔴 `_raw: true`로 **래퍼째** 받는다.
 *
 * 인터셉터가 기본적으로 래퍼를 벗겨 `data`만 주는데, 그러면 `code`가 사라진다.
 * 로그인은 `code`로 사이트를 분기해야 하므로 019가 만든 탈출구를 쓴다 — 이 함수와
 * 토큰 재발급이 `_raw`의 전부이고, 다른 용도로 번지면 A6 위반이다.
 */
export const login = async (body: LoginFormData): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginTokens>>(LOGIN_PATH, body, { _raw: true })
  const { code, data } = res.data
  return { code, accessToken: data.accessToken, refreshToken: data.refreshToken }
}
