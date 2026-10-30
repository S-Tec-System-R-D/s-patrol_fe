import { describe, expect, it } from 'vitest'
import { resolveLoginOutcome } from '../loginResult'
import { paths } from '@/router/paths'

/**
 * 로그인 `code` → 다음 행동. 화면 테스트보다 싸게 code 사전 전체를 고정한다
 * (`api-spec.md` §2-1 실측값 5종 + 사전에 없는 값).
 */
describe('resolveLoginOutcome', () => {
  it.each([101, 102, 103])('본사 화면 · 본사 code(%i)는 본사 홈으로', (code) => {
    expect(resolveLoginOutcome(code, 'admin')).toEqual({
      kind: 'allowed',
      landing: paths.admin.locations,
    })
  })

  it('현장 화면 · 현장관리자 code(201)는 현장 홈으로', () => {
    expect(resolveLoginOutcome(201, 'service')).toEqual({
      kind: 'allowed',
      landing: paths.service.zones,
    })
  })

  /**
   * 🔴 202는 `2xx`(현장 코드대)에 속한다. 근무자 판정이 사이트 판정보다 **먼저** 와야 하고,
   * 순서가 바뀌면 근무자가 현장 사이트로 들어간다. 이 테스트가 그 순서를 지킨다.
   */
  it('근무자 code(202)는 차단된다 — 현장 코드대이지만 통과시키지 않는다', () => {
    const outcome = resolveLoginOutcome(202, 'service')

    expect(outcome.kind).toBe('blocked')
    expect(outcome).not.toHaveProperty('landing')
  })

  it.each([0, 400, 301, 999, -1])('사전에 없는 code(%i)는 unknown', (code) => {
    const outcome = resolveLoginOutcome(code, 'service')

    expect(outcome.kind).toBe('unknown')
    expect(outcome).not.toHaveProperty('landing')
  })

  /**
   * `200`(일반 조회 성공 code)은 사전의 로그인 code가 아니지만 `2xx` 범위라 현장으로 간다.
   * 019의 `isServiceLoginCode`가 "2xx = 현장"이라는 범위 규칙이기 때문이다.
   *
   * 화이트리스트(실측 5개만 허용)로 좁히지 않고 범위를 유지한다 — 서버가 `104`·`204` 같은
   * 권한을 추가하면 화이트리스트는 로그인을 막아버린다. 반면 사이트 분기는 **힌트**이고
   * 최종 권한은 JWT `role`이 정하므로, 범위를 넓게 잡아도 권한이 새지 않는다
   * (role이 없거나 매핑 밖이면 가드가 막는다).
   */
  it('200은 사전에 없지만 2xx 범위라 현장으로 간다 — 의도된 동작', () => {
    expect(resolveLoginOutcome(200, 'service')).toEqual({
      kind: 'allowed',
      landing: paths.service.zones,
    })
  })

  it('allowed가 아닌 결과는 항상 사용자에게 보여줄 문구를 갖는다', () => {
    for (const code of [202, 999]) {
      const outcome = resolveLoginOutcome(code, 'service')
      expect(outcome.kind).not.toBe('allowed')
      if (outcome.kind !== 'allowed') {
        expect(outcome.message.length).toBeGreaterThan(0)
      }
    }
  })

  /** 🔴 화면과 계정 사이트가 다르면 막는다(`spec 063`) — 020 의 "화면 무관" 을 뒤집었다 */
  it.each([101, 102, 103])('현장 화면 · 본사 code(%i)는 막는다 — 안내만, 본사 주소 링크 없음', (code) => {
    const outcome = resolveLoginOutcome(code, 'service')
    expect(outcome).toEqual({ kind: 'blocked', message: expect.stringMatching(/관리자 계정/) })
    expect(outcome).not.toHaveProperty('link')
  })

  it('본사 화면 · 현장관리자 code(201)는 막는다 — 현장 로그인(/) 링크', () => {
    expect(resolveLoginOutcome(201, 'admin')).toEqual({
      kind: 'blocked',
      message: expect.stringMatching(/현장 로그인/),
      link: { to: paths.serviceLogin, label: '현장 로그인으로 이동' },
    })
  })

  it('본사 화면 · 근무자 code(202)는 근무자 안내가 먼저다', () => {
    expect(resolveLoginOutcome(202, 'admin')).toEqual({
      kind: 'blocked',
      message: expect.stringMatching(/모바일 앱/),
    })
  })
})
