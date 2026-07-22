/**
 * 토큰 저장/조회/제거 헬퍼.
 * - 저장소: localStorage (003 결정 — spec.md §3 기술 제약)
 * - 손상/타입 비정상 값은 `null` 취급. 자동 클리어는 하지 않는다(비파괴).
 */

const ACCESS_KEY = 'auth.accessToken'
const REFRESH_KEY = 'auth.refreshToken'

/**
 * 개발용 role 스위치 키. Phase 3 실 로그인 폼 도입 시 제거.
 * - LoginPage / AdminLoginPage의 임시 진입 버튼이 저장.
 * - MSW `/auth/me` 핸들러가 읽어 role 동적 반환.
 */
export const DEV_ROLE_KEY = 'dev.role'

const readString = (key: string): string | null => {
  try {
    const value = localStorage.getItem(key)
    return typeof value === 'string' && value.length > 0 ? value : null
  } catch {
    // localStorage 접근 자체가 막힌 환경(SSR·시크릿 모드 일부 등) 방어
    return null
  }
}

const writeString = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 저장 실패는 무시 — 다음 401에서 자연스럽게 로그인 이동 */
  }
}

const removeKey = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

export const getAccessToken = (): string | null => readString(ACCESS_KEY)
export const setAccessToken = (token: string): void => writeString(ACCESS_KEY, token)

export const getRefreshToken = (): string | null => readString(REFRESH_KEY)
export const setRefreshToken = (token: string): void => writeString(REFRESH_KEY, token)

export const clearTokens = (): void => {
  removeKey(ACCESS_KEY)
  removeKey(REFRESH_KEY)
}
