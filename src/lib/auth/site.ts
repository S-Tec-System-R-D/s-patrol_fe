/**
 * 선택한 사업장(`siteSeq`·`siteName`) 저장/조회/제거 헬퍼.
 * - 저장소: localStorage — `tokens.ts`와 **같은 저장소·같은 생애**로 묶는다.
 *   `sessionStorage`면 새 탭·브라우저 재시작마다 "토큰은 있고 `siteSeq`는 없는"
 *   고장 상태가 기본 동작이 된다(`spec 021` §3 규칙 2).
 * - 손상/타입 비정상 값은 `null` 취급. 자동 클리어는 하지 않는다(`tokens.ts` 비파괴 방침).
 *
 * 🔴 **`tokens.ts`에서 `readString`/`writeString`을 import하지 않는다.**
 * `clearTokens()`가 `clearSite()`를 호출하므로(`spec 021` T229) import하면 순환 참조가
 * 된다. try/catch 헬퍼 복제를 수용한다 — 대안인 `storage.ts` 추출은 `tokens.ts`
 * 리팩토링이라 A3(최소 변경) 위반이다.
 */

const SITE_SEQ_KEY = 'auth.siteSeq'
const SITE_NAME_KEY = 'auth.siteName'

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
    /* 저장 실패는 무시 — 다음 진입에서 AuthGuard가 로그인으로 보낸다 */
  }
}

const removeKey = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

/**
 * 선택된 `siteSeq`. 없거나 정수로 파싱되지 않으면 `null`.
 *
 * ID는 `number`(int32)이므로(`CLAUDE.md` B4) 소수·공백·빈 문자열·`NaN`은 전부 거부한다.
 * `Number('')`이 `0`이 되는 함정 때문에 `readString`의 빈 문자열 처리에 의존한다.
 */
export const getSiteSeq = (): number | null => {
  const raw = readString(SITE_SEQ_KEY)
  if (raw === null) return null

  const parsed = Number(raw)
  return Number.isInteger(parsed) ? parsed : null
}

/** 선택된 사업장명. `useMe().data.locationName`의 출처다(`spec 021` T231) */
export const getSiteName = (): string | null => readString(SITE_NAME_KEY)

/** 선택 결과 저장. `siteSeq`와 `siteName`은 항상 함께 쓴다 — 따로 저장할 이유가 없다 */
export const setSite = (siteSeq: number, siteName: string): void => {
  writeString(SITE_SEQ_KEY, String(siteSeq))
  writeString(SITE_NAME_KEY, siteName)
}

/**
 * 선택 해제. `clearTokens()`가 호출한다 — 로그아웃 시 남으면 다음 사용자 계정에
 * 이전 사업장이 붙는다(`spec 021` §3 규칙 3).
 */
export const clearSite = (): void => {
  removeKey(SITE_SEQ_KEY)
  removeKey(SITE_NAME_KEY)
}
