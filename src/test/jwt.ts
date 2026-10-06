/**
 * 테스트용 accessToken 생성 헬퍼.
 *
 * 백엔드에 본인 정보 조회가 없어 인증 테스트는 **토큰을 심는 것**으로 사용자를 만든다.
 * `spec 020` 이후 모든 인증 관련 테스트의 공용 도구다.
 *
 * 서명은 의미 없는 placeholder — 클라이언트는 payload를 읽기만 하고 검증하지 않는다.
 */

import { MS_ROLE_CLAIM, type AccessTokenClaims } from '@/features/auth/types/claims'

/**
 * 문자열 → base64url.
 *
 * `btoa`는 Latin-1만 받으므로 한글을 그대로 넣으면 터진다. 실측 클레임의 `userName`·
 * `roleDisplay`가 한글이라 UTF-8 바이트로 변환한 뒤 인코딩해야 하고, 이 과정이
 * `decodeAccessToken`의 역방향이라 **디코딩 쪽 UTF-8 처리까지 함께 검증**된다.
 */
const toBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const ISSUER = 'https://stsp.s-tec.co.kr'

/** 실측 형태(`api-spec.md` §1-2)를 따르는 기본 클레임 — 현장관리자 */
const defaultClaims = (): AccessTokenClaims => {
  const now = Math.floor(Date.now() / 1000)
  return {
    userSeq: 1,
    loginId: '333333',
    userName: '홍길동',
    uuid: 'a'.repeat(32),
    roleDisplay: '현장관리자',
    [MS_ROLE_CLAIM]: 'FieldManager',
    nbf: now,
    exp: now + 10800, // 실측 수명 3시간
    iss: ISSUER,
    aud: ISSUER,
  }
}

/**
 * 테스트용 accessToken 문자열.
 * @param overrides 바꿀 클레임만 넘긴다. `{ [MS_ROLE_CLAIM]: 'SystemManager' }` 형태로 권한 교체.
 */
export const makeAccessToken = (overrides: Partial<AccessTokenClaims> = {}): string => {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(JSON.stringify({ ...defaultClaims(), ...overrides }))
  return `${header}.${payload}.test-signature`
}
