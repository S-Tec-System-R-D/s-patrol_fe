import { LOGIN_CODE, isAdminLoginCode, isServiceLoginCode } from '@/types/api'
import { paths } from '@/router/paths'

/**
 * 로그인 응답 `code` → 다음 행동.
 *
 * `code`는 **1회성 라우팅 힌트**다. 저장하지 않고 여기서 소비하고 버린다
 * (권한 판단의 SSOT는 JWT `role` — `CLAUDE.md` B4).
 *
 * 🔴 **로그인 화면(`area`)과 계정 사이트가 다르면 막는다**(`spec 063`, 사용자 결정 2026-10-30 — 020 의
 * "착지는 code 가 정한다, 화면은 무관" 을 뒤집었다). 본사 화면에서 현장관리자 → 현장 로그인 링크와 함께 안내,
 * 현장 화면에서 본사 계정 → 안내만(본사 로그인 주소는 드러내지 않는다 — `flow.md` §0). 토큰은 저장하지 않는다.
 *
 * 랜딩 경로를 `role`이 아니라 `code`로 정하는 이유: 미실측 `role`(OQ-D)이면 `toRole`이
 * `null`이라 `homePath()`를 구할 수 없다. `code`는 사이트가 확실히 담겨 있어 그 경우에도
 * 착지점이 결정된다. 권한 차단은 그 뒤 가드가 한다.
 */

/** 로그인한 화면 — 현장(`/`) · 본사(`/admin/login`) */
export type LoginArea = 'service' | 'admin'

export type LoginOutcome =
  /** 진입 허용 — 토큰을 저장하고 `landing`으로 보낸다 */
  | { kind: 'allowed'; landing: string }
  /** 로그인은 성공했으나 이 화면으로는 진입 불가 — 근무자 · 다른 사이트 계정. `link` 는 갈 곳 안내 */
  | { kind: 'blocked'; message: string; link?: { to: string; label: string } }
  /** 사전에 없는 code — 사이트를 특정할 수 없다 */
  | { kind: 'unknown'; message: string }

export const resolveLoginOutcome = (code: number, area: LoginArea): LoginOutcome => {
  // 🔴 근무자 판정이 사이트 판정보다 먼저다. 202는 현장 코드대이기도 해서
  // 순서가 바뀌면 근무자가 현장 사이트로 들어간다.
  if (code === LOGIN_CODE.WORKER) {
    return {
      kind: 'blocked',
      message: '근무자는 웹에서 이용할 수 없습니다. 모바일 앱을 사용해주세요.',
    }
  }

  if (isAdminLoginCode(code)) {
    if (area === 'service') {
      return { kind: 'blocked', message: '관리자 계정입니다. 관리자 로그인 주소로 접속해주세요.' }
    }
    return { kind: 'allowed', landing: paths.admin.locations }
  }
  if (isServiceLoginCode(code)) {
    if (area === 'admin') {
      return {
        kind: 'blocked',
        message: '현장관리자 계정은 현장 로그인을 이용해주세요.',
        link: { to: paths.serviceLogin, label: '현장 로그인으로 이동' },
      }
    }
    return { kind: 'allowed', landing: paths.service.zones }
  }

  // 서버가 사전에 없는 code를 주는 경우. 추측으로 어느 사이트든 보내지 않는다 —
  // 모르는 값을 통과시키는 것이 권한 사고가 된다(A1).
  return { kind: 'unknown', message: '로그인 응답을 처리할 수 없습니다. 관리자에게 문의해주세요.' }
}
