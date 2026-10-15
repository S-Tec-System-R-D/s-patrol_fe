import { describe, expect, it } from 'vitest'

import { authSwitchSchema, pointSchema } from '../schema'

/**
 * 지점 폼 스키마 (`spec 029` T432).
 *
 * 🔴 **이 파일이 지키는 것은 "TAG ID 규칙이 한 곳에서 나온다" 는 사실이다.** 029 에서
 * 소비처가 **셋**이 됐다 — 추가 폼 · 수정 폼 · 인증수단 전환 모달. 같은 규칙을 세 군데에
 * 적으면 한 곳만 고쳐지고 나머지는 남는다(022 가 "에러 바인딩 복붙" 으로 겪은 종류).
 *
 * 🔴 **2026-10-15: 추가 폼과 수정 폼이 `pointSchema` 하나를 공유한다.** `makeEditPointSchema`
 * 는 수단이 폼 밖(서버값)에 있을 때 필요했던 장치인데, 수정 폼이 수단을 직접 고르게 되면서
 * 사라졌다 — 서버가 `authMethod` 없이는 `nfcTagId` 를 처리하지 않기 때문이다(실측).
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
      // 수정 폼도 같은 스키마를 쓴다 — 아래 케이스는 "수단을 NFC 로 고른 수정 폼" 이다
      name: '수정 폼(pointSchema — NFC 선택)',
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

describe('pointSchema — QR 을 고른 경우', () => {
  it('🔴 QR 이면 TAG ID 를 검사하지 않는다 — 화면에 필드 자체가 없다', () => {
    // QR 지점에 남아 있는 TAG ID 는 지울 수단이 아예 없고(백엔드 요청 P1) 전송도
    // 하지 않으므로, 폼이 그 값을 막을 이유가 없다
    const result = pointSchema.safeParse({
      name: '정문 입구',
      description: '',
      authenticationMethod: 'QR',
      nfcTagId: '',
      useYn: true,
    })

    expect(result.success).toBe(true)
  })

  it('🔴 QR 이면 남아 있는 잘못된 형식의 TAG ID 도 저장을 막지 않는다', () => {
    // 수정 폼은 QR 지점의 잔존 값을 `defaultValues` 로 들고 있다(NFC 로 되돌릴 때
    // 쓰려고). 그 값 때문에 이름만 고치는 저장이 막히면 안 된다
    const result = pointSchema.safeParse({
      name: '정문 입구',
      description: '',
      authenticationMethod: 'QR',
      nfcTagId: 'LEGACY-TAG',
      useYn: true,
    })

    expect(result.success).toBe(true)
  })

  it('이름은 두 글자 이상이다 — 수단과 무관하다', () => {
    const result = pointSchema.safeParse({
      name: '문',
      description: '',
      authenticationMethod: 'QR',
      nfcTagId: '',
      useYn: true,
    })

    expect(result.success).toBe(false)
  })
})

describe('pointSchema — 인증수단은 추가·수정 양쪽에서 필수다', () => {
  it('🔴 수단을 고르지 않으면 막는다 — 미실측 코드로 열린 수정 폼이 이 경로다', () => {
    const result = pointSchema.safeParse({
      name: '정문 입구',
      description: '',
      nfcTagId: '',
      useYn: true,
    })

    expect(result.success).toBe(false)
  })
})
