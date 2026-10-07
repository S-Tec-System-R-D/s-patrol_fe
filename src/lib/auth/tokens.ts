/**
 * 토큰 저장/조회/제거 헬퍼.
 * - 저장소: localStorage (003 결정 — spec.md §3 기술 제약)
 * - 손상/타입 비정상 값은 `null` 취급. 자동 클리어는 하지 않는다(비파괴).
 */

import { clearSite } from '@/lib/auth/site'

const ACCESS_KEY = 'auth.accessToken'
const REFRESH_KEY = 'auth.refreshToken'

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

/**
 * 로그아웃·세션 종료. 🔴 **선택한 사업장도 함께 지운다**(`spec 021` §3 규칙 3).
 *
 * 남기면 다음 사용자 계정에 이전 사업장이 붙는다. 테스트 다수가 cleanup으로 이 함수를
 * 쓰므로, 여기서 지우지 않으면 `siteSeq`가 테스트 간에 누설돼 순서 의존 실패가 된다.
 *
 * 의존 방향은 `tokens.ts` → `site.ts` **단방향**이다. `site.ts`가 이쪽 헬퍼를
 * import하지 않는 이유가 이것이다(순환 회피 — `site.ts` 상단 주석).
 */
export const clearTokens = (): void => {
  removeKey(ACCESS_KEY)
  removeKey(REFRESH_KEY)
  clearSite()
}
