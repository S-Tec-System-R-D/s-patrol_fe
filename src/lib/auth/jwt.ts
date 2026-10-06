/**
 * accessToken JWT payload 디코딩.
 *
 * 백엔드에 본인 정보 조회 엔드포인트가 없어 사용자 정보는 토큰에서 꺼낸다(`api-spec.md` §1-2).
 *
 * - **검증이 아니라 읽기다.** 서명 검증은 서버 책임이고, 여기서는 payload를 그대로 파싱한다.
 *   따라서 이 함수가 값을 돌려준다는 것은 "토큰이 유효하다"는 뜻이 **아니다**.
 * - 패키지를 추가하지 않는다(읽기 전용이라 불필요 — spec 020 §3 기술 제약).
 * - 🔴 **어떤 입력에도 throw하지 않는다.** 토큰은 localStorage에서 오므로 손상·조작·구버전
 *   형식이 모두 가능하고, 여기서 예외가 나면 가드 렌더 중에 터져 화면이 하얘진다.
 */

import type { AccessTokenClaims } from '@/features/auth/types/claims'

/** base64url → base64 (padding 복원 포함) */
const toBase64 = (segment: string): string => {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = base64.length % 4
  return remainder === 0 ? base64 : base64 + '='.repeat(4 - remainder)
}

/**
 * base64 문자열을 UTF-8로 디코딩.
 *
 * `atob`는 바이트열을 "문자당 1바이트" 문자열로 주기 때문에, 그대로 `JSON.parse`하면
 * **한글이 깨진다.** 실측 클레임의 `userName`·`roleDisplay`가 한글(`'현장관리자'`)이라
 * 반드시 바이트로 되돌린 뒤 `TextDecoder`를 거쳐야 한다.
 */
const decodeUtf8 = (base64: string): string => {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * accessToken의 payload를 꺼낸다. 실패하면 `null`.
 *
 * 반환 타입을 `AccessTokenClaims`로 단정하되 **필드 유무는 검사하지 않는다.**
 * 객체인지만 확인하는 최소 판별이며, 개별 필드가 비었을 때의 처리는 소비처 책임이다
 * (`role`이 없으면 `toRole`이 `null` → 권한 없음). 필드까지 전수 검사하면 서버가 필드를
 * 하나 추가·변경할 때 로그인 전체가 막히는 쪽이 더 위험하다.
 */
export const decodeAccessToken = (token: string | null): AccessTokenClaims | null => {
  if (!token) return null

  const segments = token.split('.')
  if (segments.length !== 3) return null

  try {
    const payload: unknown = JSON.parse(decodeUtf8(toBase64(segments[1])))
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return null
    }
    return payload as AccessTokenClaims
  } catch {
    // atob의 InvalidCharacterError / JSON.parse의 SyntaxError 모두 여기로 흡수한다.
    return null
  }
}
