import type { AuthMethod } from '@/types/enum'

/**
 * 인증수단 정수 ↔ 표시값 변환.
 *
 * 서버는 `authMethod` 를 **정수**(9/10)로 주고받는데, 폼(`AuthMethodSelector`)과
 * Enum SSOT(`types/enum.ts` `AuthMethod`)는 **문자열**(`'QR' | 'NFC'`)을 쓴다.
 * `spec 022` §3 규칙 5가 허용한 **유일한 어댑터 자리**이고(`CLAUDE.md` B4 조건 ②
 * "정수 enum → 표시용 값"), 변환은 여기 한 곳에서만 한다.
 *
 * 🔴 **컴포넌트의 prop 계약을 정수로 바꾸지 않는다.** `AuthMethodDisplay`·
 * `AuthMethodSelector` 는 계속 문자열을 받는다 — 테스트 3건이 그 계약에 걸려 있고,
 * 계약을 바꾸면 폼 2개가 함께 움직여야 한다(`tasks.md` 제약 2).
 *
 * 실측: `docs/api-spec.md` §4
 *   9 → 'QR' / 10 → 'NFC' / null → '' 또는 'Unknown' (미인증 지점이력)
 */

/** 표시값 → 서버 코드 */
const CODE_BY_LABEL: Record<AuthMethod, number> = {
  QR: 9,
  NFC: 10,
}

/** 서버 코드 → 표시값. 실측된 2개만 넣는다 */
const LABEL_BY_CODE: Record<number, AuthMethod> = {
  9: 'QR',
  10: 'NFC',
}

/**
 * `authMethodName` 이 "값 없음"을 나타내는 표현들.
 * 🔴 백엔드가 `null` 을 **두 가지로** 표현한다(B-6) — 둘 다 없는 것으로 본다.
 */
const EMPTY_NAMES = new Set(['', 'Unknown'])

/** 폼 값 → 서버 전송용 정수 코드 */
export const toAuthMethodCode = (label: AuthMethod): number => CODE_BY_LABEL[label]

/**
 * 서버 코드 → 폼/컴포넌트용 문자열.
 * 미실측 코드(9·10 외)는 `null` 을 반환한다 — **추측 라벨을 만들지 않는다**(A1).
 * 호출부는 `null` 일 때 선택 상태를 비우거나 `resolveAuthMethodLabel` 로 표시만 한다.
 */
export const toAuthMethodLabel = (code: number): AuthMethod | null =>
  LABEL_BY_CODE[code] ?? null

/**
 * 화면 표시용 라벨.
 *
 * 우선순위: **서버 `authMethodName`** → 매핑표 → 빈 문자열.
 * 서버가 표시명을 주므로 그것을 먼저 쓰고(B4 "서버 응답이 메인"), 비어 있을 때만
 * 매핑표로 떨어진다. 둘 다 없으면 `''` 를 돌려주고 **없는 라벨을 만들지 않는다** —
 * 호출부는 빈 문자열이면 뱃지를 숨긴다.
 */
export const resolveAuthMethodLabel = (code: number, name: string | null): string => {
  const trimmed = name?.trim() ?? ''
  if (!EMPTY_NAMES.has(trimmed)) return trimmed
  return LABEL_BY_CODE[code] ?? ''
}
