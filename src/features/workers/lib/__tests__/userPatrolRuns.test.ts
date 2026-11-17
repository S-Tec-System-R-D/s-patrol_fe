import { describe, expect, it } from 'vitest'

import type { CourseHistoryRow } from '@/features/course-history/types'
import {
  filterMyRuns,
  groupRunsByDay,
  runDayBuckets,
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


  it('요약 — 회차 · 지점 인증 두 수 · 미완료 · 특이사항 · 시간초과 (미인증 지점 수는 세지 않는다 D13)', () => {
    const summary = summarizeRuns([
      run({ checkedCount: 3, hasMemo: true }),
      run({ overtimeYn: true }),
      run({ pointCount: 5, checkedCount: 5 }),
      run({ status: 2, overtimeYn: true, checkedCount: 2 }),
    ])
    expect(summary).toEqual({ runs: 4, points: 17, checked: 14, incomplete: 1, memo: 1, overtime: 2 })
  })

  it('🔴 요약 · 차트는 끝난 회차만 — 진행 중은 세지 않는다 (D14)', () => {
    const rows = [run(), run({ status: 0, endDt: null, checkedCount: 1, overtimeYn: true, hasMemo: true })]
    expect(summarizeRuns(rows)).toEqual({ runs: 1, points: 4, checked: 4, incomplete: 0, memo: 0, overtime: 0 })
    expect(runDayBuckets(rows, new Date(2026, 10, 16))[13]).toEqual({
      date: '2026-11-16',
      completed: 1,
      incomplete: 0,
      overtime: 0,
    })
  })

  it('🔴 상태와 시간초과는 따로 센다 — 미완료이면서 시간초과인 회차는 양쪽에 들어간다 (D14)', () => {
    const rows = [
      run(),
      run({ overtimeYn: true }),
      run({ status: 2 }),
      run({ status: 2, overtimeYn: true }),
      // 미인증 지점이 있어도 회차 상태는 바뀌지 않는다
      run({ checkedCount: 2 }),
    ]
    const day = runDayBuckets(rows, new Date(2026, 10, 16))[13]
    expect(day).toEqual({ date: '2026-11-16', completed: 3, incomplete: 2, overtime: 2 })
    // 막대 합 = 요약
    const summary = summarizeRuns(rows)
    expect(day.completed + day.incomplete).toBe(summary.runs)
    expect(day.incomplete).toBe(summary.incomplete)
    expect(day.overtime).toBe(summary.overtime)
  })

  it('14일 칸 — 기록 없는 날도 0 으로 두고 날짜 오름차순', () => {
    const today = new Date(2026, 10, 16)
    const buckets = runDayBuckets(
      [run(), run({ overtimeYn: true }), run({ startDt: '2026-11-03T09:00:00', checkedCount: 1 })],
      today
    )
    expect(buckets).toHaveLength(14)
    expect(buckets[0]).toEqual({ date: '2026-11-03', completed: 1, incomplete: 0, overtime: 0 })
    expect(buckets[13]).toEqual({ date: '2026-11-16', completed: 2, incomplete: 0, overtime: 1 })
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
