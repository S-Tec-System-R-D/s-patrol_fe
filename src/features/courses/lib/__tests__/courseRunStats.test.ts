import { describe, expect, it } from 'vitest'

import type { CourseHistoryRow } from '@/features/course-history/types'
import { checkRatio, hourlyCounts, hourSpan, workerStats } from '../courseRunStats'

const row = (overrides: Partial<CourseHistoryRow> = {}): CourseHistoryRow => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: 'A',
  useYn: true,
  startDt: '2026-11-10T09:10:00',
  endDt: '2026-11-10T09:40:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 4,
  checkedCount: 4,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:30:00',
  hasMemo: false,
  userList: [{ userSeq: 1, userName: '가' }],
  ...overrides,
})

describe('hourlyCounts · hourSpan', () => {
  it('시작 시각의 시로 센다 · 깨진 시각은 뺀다', () => {
    const counts = hourlyCounts([
      row({ startDt: '2026-11-10T09:10:00' }),
      row({ startDt: '2026-11-10T09:50:00' }),
      row({ startDt: '2026-11-10T17:00:00' }),
      row({ startDt: 'bad' }),
    ])
    expect(counts[9]).toBe(2)
    expect(counts[17]).toBe(1)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(3)
  })

  it('순찰 시간대와 그 밖의 기록 없는 시간대', () => {
    const counts = hourlyCounts([row({ startDt: '2026-11-10T09:10:00' }), row({ startDt: '2026-11-10T17:00:00' })])
    expect(hourSpan(counts)).toEqual({ active: '09–17시', empty: '18–08시' })
  })

  it('🔴 자정을 넘는 야간 순찰 — 가장 긴 빈 구간을 뺀 나머지', () => {
    const counts = hourlyCounts(
      ['23:05', '02:38', '02:51', '23:00', '10:40'].map((t) => row({ startDt: `2026-11-10T${t}:00` }))
    )
    // 빈 구간: 03–09(7시간) · 11–22(12시간) → 가장 긴 11–22 를 뺀다
    expect(hourSpan(counts)).toEqual({ active: '23–10시', empty: '11–22시' })
  })

  it('한 시뿐이면 `14시` · 하루 전체면 기록 없음 문구가 없다 · 기록이 없으면 null', () => {
    expect(hourSpan(hourlyCounts([row({ startDt: '2026-11-10T14:00:00' })]))).toEqual({
      active: '14시',
      empty: '15–13시',
    })
    expect(hourSpan(Array.from({ length: 24 }, () => 1))).toEqual({ active: '00–23시', empty: null })
    expect(hourSpan(Array.from({ length: 24 }, () => 0))).toBeNull()
  })
})

describe('workerStats', () => {
  it('🔴 교대 회차는 회차 수에만 든다 — 인증률은 혼자 끝낸 회차만 · 근무자 없음은 맨 아래 · 회차 많은 순', () => {
    const stats = workerStats([
      row({ checkedCount: 4, userList: [{ userSeq: 1, userName: '가' }] }),
      row({ checkedCount: 2, userList: [{ userSeq: 1, userName: '가' }, { userSeq: 2, userName: '나' }] }),
      row({ checkedCount: 0, userList: [] }),
      row({ checkedCount: 1, userList: [{ userSeq: 1, userName: '가' }] }),
    ])
    expect(stats.map((s) => [s.userName, s.runs, s.handovers, s.checked, s.points])).toEqual([
      ['가', 3, 1, 5, 8],
      // 교대 회차만 있으면 인증률 분모가 0 — 화면은 `-`
      ['나', 1, 1, 0, 0],
      [null, 1, 0, 0, 4],
    ])
  })

  it('같은 사람이 한 회차에 두 번 있어도 한 번만 센다', () => {
    const stats = workerStats([
      row({ userList: [{ userSeq: 1, userName: '가' }, { userSeq: 1, userName: '가' }] }),
    ])
    expect(stats).toHaveLength(1)
    expect(stats[0].runs).toBe(1)
  })
})

describe('checkRatio', () => {
  it('분모 0 이면 null · 1 을 넘지 않는다', () => {
    expect(checkRatio(1, 0)).toBeNull()
    expect(checkRatio(5, 4)).toBe(1)
    expect(checkRatio(1, 4)).toBe(0.25)
  })
})
