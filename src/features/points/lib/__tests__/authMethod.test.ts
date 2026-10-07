import { describe, expect, it } from 'vitest'

import {
  resolveAuthMethodLabel,
  toAuthMethodCode,
  toAuthMethodLabel,
} from '../authMethod'

describe('toAuthMethodCode', () => {
  it('폼 값을 서버 코드로 바꾼다', () => {
    expect(toAuthMethodCode('QR')).toBe(9)
    expect(toAuthMethodCode('NFC')).toBe(10)
  })
})

describe('toAuthMethodLabel', () => {
  it('실측 코드를 폼 값으로 되돌린다', () => {
    expect(toAuthMethodLabel(9)).toBe('QR')
    expect(toAuthMethodLabel(10)).toBe('NFC')
  })

  it('왕복이 보존된다', () => {
    expect(toAuthMethodLabel(toAuthMethodCode('QR'))).toBe('QR')
    expect(toAuthMethodLabel(toAuthMethodCode('NFC'))).toBe('NFC')
  })

  it('미실측 코드는 null이다 — 추측 라벨을 만들지 않는다', () => {
    expect(toAuthMethodLabel(11)).toBeNull()
    expect(toAuthMethodLabel(0)).toBeNull()
  })
})

describe('resolveAuthMethodLabel', () => {
  it('서버 표시명을 우선한다', () => {
    expect(resolveAuthMethodLabel(9, 'QR')).toBe('QR')
    expect(resolveAuthMethodLabel(10, 'NFC')).toBe('NFC')
  })

  it('서버 표시명이 비어 있으면 매핑표로 떨어진다 — 빈 문자열', () => {
    expect(resolveAuthMethodLabel(9, '')).toBe('QR')
  })

  it("서버 표시명이 'Unknown'이면 매핑표로 떨어진다 (B-6 — null 표현이 2종이다)", () => {
    expect(resolveAuthMethodLabel(10, 'Unknown')).toBe('NFC')
  })

  it('공백만 있는 표시명도 비어 있는 것으로 본다', () => {
    expect(resolveAuthMethodLabel(9, '   ')).toBe('QR')
  })

  it('표시명이 null이어도 매핑표로 떨어진다', () => {
    expect(resolveAuthMethodLabel(9, null)).toBe('QR')
  })

  it('미실측 코드라도 서버 표시명이 있으면 그 원문을 쓴다', () => {
    expect(resolveAuthMethodLabel(11, 'GPS')).toBe('GPS')
  })

  it('미실측 코드 + 표시명 없음이면 빈 문자열 — 없는 라벨을 만들지 않는다', () => {
    expect(resolveAuthMethodLabel(11, '')).toBe('')
    expect(resolveAuthMethodLabel(11, 'Unknown')).toBe('')
  })
})
