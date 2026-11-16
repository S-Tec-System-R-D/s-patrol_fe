import { describe, expect, it } from 'vitest'

import { formatTyping, minuteOptions, normalizeTime, splitTime } from '../timeInput'

describe('timeInput — 24시간 HH:mm (spec 080 D8)', () => {
  it('입력 중 — 숫자만 · 셋째 자리부터 콜론', () => {
    expect(formatTyping('12')).toBe('12')
    expect(formatTyping('123')).toBe('12:3')
    expect(formatTyping('1230')).toBe('12:30')
    expect(formatTyping('22:00')).toBe('22:00')
    expect(formatTyping('12305')).toBe('12:30')
    expect(formatTyping('ab')).toBe('')
  })

  it('떠날 때 — 짧게 친 값을 채운다', () => {
    expect(normalizeTime('9')).toBe('09:00')
    expect(normalizeTime('14')).toBe('14:00')
    expect(normalizeTime('930')).toBe('09:30')
    expect(normalizeTime('12:30')).toBe('12:30')
    expect(normalizeTime('')).toBe('')
  })

  it('분 목록 — 5분 단위 · 지금 값이 단위 밖이면 끼운다', () => {
    expect(minuteOptions(null)).toHaveLength(12)
    expect(minuteOptions('30')).toHaveLength(12)
    expect(minuteOptions('16')).toContain('16')
    expect(minuteOptions('16').indexOf('16')).toBe(4)
  })

  it('형식이 아니면 나누지 않는다', () => {
    expect(splitTime('08:16')).toEqual(['08', '16'])
    expect(splitTime('24:00')).toBeNull()
    expect(splitTime('8:16')).toBeNull()
  })
})
