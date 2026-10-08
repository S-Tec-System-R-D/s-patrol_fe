/**
 * accessToken JWT 클레임 타입 + 앱 `Role` 매핑.
 * 출처: docs/api-spec.md §1-2 (실측).
 *
 * 백엔드에 본인 정보 조회 엔드포인트가 **없다.** 사용자 정보는 전부 이 클레임에서 나온다.
 * 서명 검증은 서버 책임이고 클라이언트는 payload를 **읽기만** 한다.
 */

import type { Role } from '@/types/enum'

/**
 * ASP.NET이 role을 담는 네임스페이스 키.
 * 타입 선언에는 리터럴을 직접 써야 해서(interface는 computed key 불가) 값이 두 번 등장한다.
 */
export const MS_ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

/**
 * accessToken payload — 실측 필드 전량.
 * 지금 쓰지 않는 필드도 둔다(`CLAUDE.md` B4 "응답 타입은 실측 그대로 전량 선언").
 *
 * `iss`/`aud`는 실측값이 `'https://stsp.s-tec.co.kr'`이지만 리터럴로 고정하지 않는다 —
 * 서버가 환경별로 달리 줄 수 있고, 이 타입의 역할은 식별이 아니라 읽기다.
 */
export interface AccessTokenClaims {
  /**
   * 🔴 **문자열이다.** 실측(2026-10-08): `'13'`·`'1'`. `CLAUDE.md` B4 "ID는 number" 는
   * 우리 모델(`MeDto.userSeq`)에 적용되고, **클레임 타입은 실측 그대로 선언**한다
   * ("서버 응답이 메인"). 변환은 어댑터 한 자리(`useMe`)에서만 한다 — B4 어댑터 조건 ③
   * "타입·포맷 차이". 022 Phase 8 R1 에서 `number` 로 선언돼 있던 것을 바로잡았다.
   */
  userSeq: string
  loginId: string
  userName: string
  /** 하이픈 없는 32자 hex */
  uuid: string
  /** 한글 표시명 — '현장관리자' | '시스템관리자' | ... */
  roleDisplay: string
  /** 'FieldManager' | 'SystemManager' | ... — 권한 판단의 SSOT */
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string
  nbf: number
  /** 발급 + 10800초(3시간) */
  exp: number
  iss: string
  aud: string
}

/**
 * JWT role 문자열 → 앱 `Role`.
 *
 * 🔴 **실측된 2개만 넣는다.** Master·Manager·근무자에 해당하는 문자열은 해당 계정이 없어
 * 확인하지 못했다(`api-spec.md` OQ-1). `'Master'`처럼 그럴듯한 값을 추측으로 넣으면,
 * 서버가 다른 문자열을 쓸 때 **엉뚱한 권한으로 통과**시키게 된다. 모르는 값은 통과시키지 않는 쪽이 안전하다.
 * 나머지 3종은 계정 생성 기능이 생기는 시점에 실측해 채운다.
 */
const JWT_ROLE_TO_ROLE: Record<string, Role> = {
  FieldManager: 'FIELD_MANAGER',
  SystemManager: 'SYSTEM',
}

/** 클레임의 role 문자열을 앱 `Role`로. 매핑에 없으면 `null`(= 권한 없음 처리). */
export const toRole = (claims: AccessTokenClaims): Role | null =>
  JWT_ROLE_TO_ROLE[claims[MS_ROLE_CLAIM]] ?? null
