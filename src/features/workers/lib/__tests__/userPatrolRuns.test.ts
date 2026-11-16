import { describe, expect, it } from 'vitest'

import type { CourseHistoryRow } from '@/features/course-history/types'
import {
  filterMyRuns,
  groupRunsByDay,
  isIncompleteRun,
  runDayBuckets,
  runKind,
  summarizeRuns,
} from '../userPatrolRuns'

const run = (over: Partial<CourseHistoryRow> = {}): CourseHistoryRow => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: 'A',
  useYn: true,
  startDt: '2026-11-16T09:00:00',
  endDt: '2026-11-16T09:10:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 4,
  checkedCount: 4,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:10:00',
  hasMemo: false,
  userList: [{ userSeq: 104, userName: '박지우' }],
  ...over,
})

describe('userPatrolRuns', () => {
  it('🔴 userSeq 로 다시 거른다 — 이름 부분 일치로 온 동명이인 · 다른 사람을 뺀다 (D4)', () => {
    const rows = [
      run({ historySeq: 1 }),
      run({ historySeq: 2, userList: [{ userSeq: 110, userName: '박지우' }] }),
      run({ historySeq: 3, userList: [{ userSeq: 102, userName: '이서연' }, { userSeq: 104, userName: '박지우' }] }),
      run({ historySeq: 4, userList: [] }),
    ]
    expect(filterMyRuns(rows, 104).map((r) => r.historySeq)).toEqual([1, 3])
  })

  it('🔴 미완료 포함은 두 수로 본다 — 완료인데 0/4 도 포함 · 진행 중은 아니다', () => {
    expect(isIncompleteRun(run({ checkedCount: 3 }))).toBe(true)
    expect(isIncompleteRun(run({ status: 1, checkedCount: 0 }))).toBe(true)
    expect(isIncompleteRun(run({ status: 0, checkedCount: 1, endDt: null }))).toBe(false)
    expect(isIncompleteRun(run())).toBe(false)
  })

  it('막대 색 — 미완료 포함과 시간초과가 겹치면 미완료 포함', () => {
    expect(runKind(run())).toBe('normal')
    expect(runKind(run({ overtimeYn: true }))).toBe('overtime')
    expect(runKind(run({ overtimeYn: true, checkedCount: 2 }))).toBe('incomplete')
  })

  it('요약 — 회차 · 지점 인증 두 수 · 미완료 포함 · 특이사항 · 시간초과', () => {
    const summary = summarizeRuns([
      run({ checkedCount: 3, hasMemo: true }),
      run({ overtimeYn: true }),
      run({ pointCount: 5, checkedCount: 5 }),
    ])
    expect(summary).toEqual({ runs: 3, points: 13, checked: 12, incomplete: 1, memo: 1, overtime: 1 })
  })

  it('14일 칸 — 기록 없는 날도 0 으로 두고 날짜 오름차순', () => {
    const today = new Date(2026, 10, 16)
    const buckets = runDayBuckets(
      [run(), run({ overtimeYn: true }), run({ startDt: '2026-11-03T09:00:00', checkedCount: 1 })],
      today
    )
    expect(buckets).toHaveLength(14)
    expect(buckets[0]).toEqual({ date: '2026-11-03', normal: 0, overtime: 0, incomplete: 1 })
    expect(buckets[13]).toEqual({ date: '2026-11-16', normal: 1, overtime: 1, incomplete: 0 })
  })

  it('날짜 묶음 — 최신 날짜부터 · 같은 날은 늦은 시작부터', () => {
    const groups = groupRunsByDay([
      run({ historySeq: 1, startDt: '2026-11-15T09:00:00' }),
      run({ historySeq: 2, startDt: '2026-11-16T09:00:00' }),
      run({ historySeq: 3, startDt: '2026-11-16T14:00:00' }),
    ])
    expect(groups.map((g) => [g.date, g.rows.map((r) => r.historySeq)])).toEqual([
      ['2026-11-16', [3, 2]],
      ['2026-11-15', [1]],
    ])
  })
})
