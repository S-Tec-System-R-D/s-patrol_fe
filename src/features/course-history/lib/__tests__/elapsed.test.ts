import { describe, expect, it } from 'vitest'

import { formatDuration, formatElapsed, toSeconds } from '../elapsed'

/**
 * `'HH:mm:ss'` 환산 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **고정하는 사고는 "`02:17:40` 을 2분으로 읽는 것"** 이다. 실측(2026-10-12)에서 실제로
 * 받은 값이고, 목업은 전부 "44분" 이라 그림만 보면 분 단위라고 믿게 된다.
 */

describe('toSeconds', () => {
  it('🔴 시 단위를 센다 — 앞 두 자리를 분으로 읽으면 2분이 된다', () => {
    expect(toSeconds('02:17:40')).toBe(2 * 3600 + 17 * 60 + 40)
  })

  it('한 시간 미만도 센다', () => {
    expect(toSeconds('00:44:00')).toBe(44 * 60)
  })

  it('🔴 값이 없으면 null 이다 — 0 을 돌려주면 "0초 걸린 순찰" 과 섞인다', () => {
    expect(toSeconds(null)).toBeNull()
    expect(toSeconds(undefined)).toBeNull()
    expect(toSeconds('')).toBeNull()
  })

  it('🔴 형태가 아니면 null 이다 — 추측해서 숫자를 만들지 않는다', () => {
    expect(toSeconds('44분')).toBeNull()
    expect(toSeconds('02:17')).toBeNull()
    expect(toSeconds('aa:bb:cc')).toBeNull()
    expect(toSeconds('-01:00:00')).toBeNull()
  })
})

describe('formatDuration', () => {
  it('🔴 한 시간을 넘으면 시간을 쓴다 — 137분보다 빠르게 읽힌다', () => {
    expect(formatDuration(2 * 3600 + 17 * 60 + 40)).toBe('2시간 18분')
  })

  it('정각이면 분을 붙이지 않는다', () => {
    expect(formatDuration(2 * 3600)).toBe('2시간')
  })

  it('한 시간 미만은 분만 쓴다', () => {
    expect(formatDuration(44 * 60)).toBe('44분')
  })

  it('🔴 1분 미만은 "0분" 이 아니다 — 0분은 오류처럼 보인다', () => {
    expect(formatDuration(19)).toBe('1분 미만')
  })

  it('🔴 null 은 — 다. 0분으로 적지 않는다', () => {
    expect(formatDuration(null)).toBe('—')
  })
})

describe('formatElapsed', () => {
  it('문자열을 바로 표시값으로 바꾼다', () => {
    expect(formatElapsed('02:17:40')).toBe('2시간 18분')
    expect(formatElapsed('00:44:00')).toBe('44분')
  })

  it('읽을 수 없는 값은 — 로 끝난다 — 화면이 깨지지 않는다', () => {
    expect(formatElapsed(null)).toBe('—')
    expect(formatElapsed('이상한 값')).toBe('—')
  })
})
