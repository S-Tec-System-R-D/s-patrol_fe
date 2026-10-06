import { describe, expect, it } from 'vitest'
import { decodeAccessToken } from '@/lib/auth/jwt'
import { MS_ROLE_CLAIM, toRole } from '@/features/auth/types/claims'
import { makeAccessToken } from '@/test/jwt'

describe('decodeAccessToken', () => {
  it('실측 형태 토큰에서 클레임을 전부 꺼낸다', () => {
    const claims = decodeAccessToken(makeAccessToken())

    expect(claims).not.toBeNull()
    expect(claims?.userSeq).toBe(1)
    expect(claims?.loginId).toBe('333333')
    expect(claims?.uuid).toHaveLength(32)
    expect(claims?.[MS_ROLE_CLAIM]).toBe('FieldManager')
    expect(claims?.exp).toBeGreaterThan(claims?.nbf ?? 0)
  })

  // atob는 바이트열을 주므로 TextDecoder를 거치지 않으면 한글이 깨진다.
  // 실측 클레임의 userName·roleDisplay가 한글이라 깨진 채 통과하면 화면에 그대로 드러난다.
  it('한글 클레임이 깨지지 않는다', () => {
    const claims = decodeAccessToken(
      makeAccessToken({ userName: '김현장', roleDisplay: '현장관리자' })
    )

    expect(claims?.userName).toBe('김현장')
    expect(claims?.roleDisplay).toBe('현장관리자')
  })

  it('base64url 치환 문자(-, _)가 섞인 payload도 디코딩한다', () => {
    // '?' 나 '~' 가 들어간 문자열은 base64에서 +, / 를 만들어 base64url 치환 대상이 된다.
    const claims = decodeAccessToken(makeAccessToken({ userName: '???~~~???' }))

    expect(claims?.userName).toBe('???~~~???')
  })

  it.each([
    ['null', null],
    ['빈 문자열', ''],
    ['점 없음', 'abc'],
    ['점 1개', 'abc.def'],
    ['점 4개', 'a.b.c.d'],
    ['payload가 base64가 아님', 'aaa.!!!!.ccc'],
    ['payload가 비 JSON', `aaa.${btoa('not json')}.ccc`],
    ['payload가 배열', `aaa.${btoa('[1,2,3]')}.ccc`],
    ['payload가 숫자', `aaa.${btoa('42')}.ccc`],
    ['payload가 null', `aaa.${btoa('null')}.ccc`],
  ])('비정상 입력(%s)에서 throw 없이 null을 준다', (_label, token) => {
    expect(() => decodeAccessToken(token)).not.toThrow()
    expect(decodeAccessToken(token)).toBeNull()
  })
})

describe('toRole', () => {
  it.each([
    ['FieldManager', 'FIELD_MANAGER'],
    ['SystemManager', 'SYSTEM'],
  ])('실측된 role 문자열 %s를 %s로 매핑한다', (jwtRole, expected) => {
    const claims = decodeAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: jwtRole }))

    expect(claims && toRole(claims)).toBe(expected)
  })

  // 미실측 3종(Master·Manager·근무자)을 추측으로 매핑하지 않았다는 계약.
  // 넣어두면 서버가 다른 문자열을 쓸 때 엉뚱한 권한으로 통과시키는 사고가 된다.
  it.each(['Master', 'Manager', 'Worker', 'FieldWorker', '', 'FIELD_MANAGER'])(
    '매핑에 없는 role(%s)은 null이다 — 권한 없음 처리',
    (jwtRole) => {
      const claims = decodeAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: jwtRole }))

      expect(claims && toRole(claims)).toBeNull()
    }
  )

  it('role 클레임이 아예 없어도 throw하지 않고 null이다', () => {
    const claims = decodeAccessToken(makeAccessToken())
    // 서버가 role을 빼는 경우. delete로 클레임 부재를 재현한다.
    delete (claims as Record<string, unknown>)[MS_ROLE_CLAIM]

    expect(() => claims && toRole(claims)).not.toThrow()
    expect(claims && toRole(claims)).toBeNull()
  })
})
