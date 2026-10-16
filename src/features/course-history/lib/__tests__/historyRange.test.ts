import { describe, expect, it } from 'vitest'

import { HISTORY_DAYS, recentRange } from '../historyRange'

/**
 * 조회 기간 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **고정하는 사고는 "구간이 뒤집히는 것"** 이다. 실측(2026-10-12) `from > to` 는
 * 에러가 아니라 **200 + 0건** 이라, 뒤집히면 화면이 "순찰 기록 없음" 으로 조용히 거짓을
 * 말한다. 그리고 `toDt` 는 **그 날을 포함**하므로 오늘을 끝으로 두면 오늘 순찰이 보인다.
 */

describe('recentRange', () => {
  it('오늘을 포함한 30일이다', () => {
    const range = recentRange(new Date('2026-10-12T15:00:00'))

    expect(range.toDt).toBe('2026-10-12')
    // 오늘 포함 30일 → 29일 전부터
    expect(range.fromDt).toBe('2026-09-13')
    expect(HISTORY_DAYS).toBe(30)
  })

  it('🔴 from ≤ to 다 — 뒤집히면 서버가 에러 없이 0건을 준다', () => {
    const range = recentRange(new Date('2026-01-01T00:00:00'))

    expect(range.fromDt <= range.toDt).toBe(true)
  })

  it('🔴 yyyy-MM-dd 로만 보낸다 — 시각을 붙여도 결과가 같다(실측)', () => {
    const range = recentRange(new Date('2026-10-12T23:59:59'))

    expect(range.fromDt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(range.toDt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('월·연 경계를 넘어도 맞는다', () => {
    expect(recentRange(new Date('2026-03-05T00:00:00')).fromDt).toBe('2026-02-04')
    expect(recentRange(new Date('2026-01-10T00:00:00')).fromDt).toBe('2025-12-12')
  })

  it('days 를 줄이면 구간이 좁아진다 — 기간 선택이 생길 때의 접점이다', () => {
    const range = recentRange(new Date('2026-10-12T00:00:00'), 7)

    expect(range.fromDt).toBe('2026-10-06')
  })
})
