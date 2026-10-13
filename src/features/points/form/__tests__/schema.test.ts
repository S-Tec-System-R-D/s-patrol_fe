import { describe, expect, it } from 'vitest'

import { authSwitchSchema, makeEditPointSchema, pointSchema } from '../schema'

/**
 * 지점 폼 스키마 (`spec 029` T432).
 *
 * 🔴 **이 파일이 지키는 것은 "TAG ID 규칙이 한 곳에서 나온다" 는 사실이다.** 029 에서
 * 소비처가 **셋**이 됐다 — 추가 폼 · 수정 폼 · 인증수단 전환 모달. 같은 규칙을 세 군데에
 * 적으면 한 곳만 고쳐지고 나머지는 남는다(022 가 "에러 바인딩 복붙" 으로 겪은 종류).
 */

const HEX14 = '04A1B2C3D4E5F6'

/** 각 스키마에서 `nfcTagId` 에 붙은 메시지만 뽑는다 */
const tagIdError = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  result.error?.issues.find((issue) => issue.path[0] === 'nfcTagId')?.message

describe('TAG ID 규칙 — 세 소비처가 같은 메시지를 낸다', () => {
  const cases = [
    {
      name: '추가 폼(pointSchema)',
      parse: (nfcTagId: string) =>
        pointSchema.safeParse({
          name: '정문 입구',
          description: '',
          authenticationMethod: 'NFC',
          nfcTagId,
          useYn: true,
        }),
    },
    {
      name: '수정 폼(makeEditPointSchema — NFC 지점)',
      parse: (nfcTagId: string) =>
        makeEditPointSchema(true).safeParse({
          name: '정문 입구',
          description: '',
          nfcTagId,
          useYn: true,
        }),
    },
    {
      name: '전환 모달(authSwitchSchema)',
      parse: (nfcTagId: string) => authSwitchSchema.safeParse({ nfcTagId }),
    },
  ]

  it.each(cases)('$name — 14자리 HEX 는 통과한다', ({ parse }) => {
    expect(parse(HEX14).success).toBe(true)
  })

  it.each(cases)('$name — 비어 있으면 같은 문구로 막는다', ({ parse }) => {
    const result = parse('')
    expect(result.success).toBe(false)
    expect(tagIdError(result)).toBe('NFC TAG ID를 입력해주세요.')
  })

  it.each(cases)('$name — 형식이 틀리면 같은 문구로 막는다', ({ parse }) => {
    const result = parse('ZZZ')
    expect(result.success).toBe(false)
    expect(tagIdError(result)).toContain('14자리 HEX')
  })

  it.each(cases)('$name — 13자리·15자리를 막는다 (길이 경계)', ({ parse }) => {
    expect(parse('04A1B2C3D4E5F').success).toBe(false)
    expect(parse('04A1B2C3D4E5F6A').success).toBe(false)
  })

  it.each(cases)('$name — 대소문자를 모두 받는다', ({ parse }) => {
    // ⚠️ 서버가 대문자만 받는지 **미실측**이라 변환하지 않는다(A1) — 입력한 그대로 보낸다
    expect(parse('04a1b2c3d4e5f6').success).toBe(true)
  })
})

describe('makeEditPointSchema — QR 지점', () => {
  it('🔴 QR 지점은 TAG ID 를 검사하지 않는다 — 화면에 필드 자체가 없다', () => {
    // 수단은 폼 값이 아니라 **서버값**이다. QR 지점에 남아 있는 TAG ID 는
    // 지울 수 없고(B-15) 보여주지도 않으므로 폼이 그것을 막을 이유가 없다
    const result = makeEditPointSchema(false).safeParse({
      name: '정문 입구',
      description: '',
      nfcTagId: '',
      useYn: true,
    })

    expect(result.success).toBe(true)
  })

  it('이름은 두 글자 이상이다 — 수단과 무관하다', () => {
    const result = makeEditPointSchema(false).safeParse({
      name: '문',
      description: '',
      nfcTagId: '',
      useYn: true,
    })

    expect(result.success).toBe(false)
  })
})

describe('pointSchema — 추가 폼에만 인증수단이 남는다', () => {
  it('🔴 생성할 때는 수단을 골라야 한다 — 수정 폼과 다른 점이다 (spec 029)', () => {
    const result = pointSchema.safeParse({
      name: '정문 입구',
      description: '',
      nfcTagId: '',
      useYn: true,
    })

    expect(result.success).toBe(false)
  })
})
