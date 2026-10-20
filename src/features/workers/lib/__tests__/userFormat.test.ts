import { describe, expect, it } from 'vitest'

import { formatPhone, workLabel } from '../userFormat'

/** 근무자 표시 헬퍼 (`spec 038` T602) */

describe('formatPhone', () => {
  it('11자리 휴대폰 번호에 하이픈을 넣는다 (서버는 하이픈 없이 준다)', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678')
  })

  it('10자리는 3-3-4 로 나눈다', () => {
    expect(formatPhone('0111234567')).toBe('011-123-4567')
  })

  it('🔴 형식이 아니면 원문 그대로 — 억지로 자르지 않는다', () => {
    expect(formatPhone('010-1234-5678')).toBe('010-1234-5678')
    expect(formatPhone('12345')).toBe('12345')
    expect(formatPhone('')).toBe('')
  })
})

describe('workLabel', () => {
  it('workYn 을 근무 중 / 근무 종료로 옮긴다', () => {
    expect(workLabel(true)).toBe('근무 중')
    expect(workLabel(false)).toBe('근무 종료')
  })
})
