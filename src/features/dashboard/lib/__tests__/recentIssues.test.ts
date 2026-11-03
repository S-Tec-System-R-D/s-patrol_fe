import { describe, expect, it } from 'vitest'

import type { PointHistoryRow } from '@/features/course-history/types'

import { mergeRecentIssues } from '../recentIssues'

/** `spec 068` — 최근 미완료 · 시간초과 2번 호출 합치기 */

const row = (detailSeq: number, checkDt: string, overrides: Partial<PointHistoryRow> = {}): PointHistoryRow => ({
  detailSeq,
  courseSeq: 1,
  courseName: '코스',
  pointSeq: 1,
  pointName: `P${detailSeq}`,
  checkDt,
  userSeq: 1,
  userName: '순찰자',
  authMethod: null,
  authMethodName: '',
  status: 3,
  statusName: '미완료',
  overTimeYn: false,
  hasMemo: false,
  pauseTime: '00:00:00',
  ...overrides,
})

describe('mergeRecentIssues', () => {
  it('두 목록을 checkDt 최근 순으로 섞는다', () => {
    const incomplete = [row(1, '2026-11-03T09:00:00'), row(2, '2026-11-01T09:00:00')]
    const overtime = [row(3, '2026-11-02T09:00:00', { status: 4, overTimeYn: true })]
    expect(mergeRecentIssues(incomplete, overtime).map((r) => r.detailSeq)).toEqual([1, 3, 2])
  })

  it('양쪽에 나온 행(미완료 + 시간초과)은 하나만', () => {
    const both = row(1, '2026-11-03T09:00:00', { overTimeYn: true })
    const merged = mergeRecentIssues([both, row(2, '2026-11-02T09:00:00')], [both])
    expect(merged.map((r) => r.detailSeq)).toEqual([1, 2])
  })

  it('앞 5건만', () => {
    const incomplete = [1, 2, 3, 4, 5].map((n) => row(n, `2026-11-0${n}T09:00:00`))
    const overtime = [6, 7].map((n) => row(n, `2026-10-2${n}T09:00:00`))
    expect(mergeRecentIssues(incomplete, overtime).map((r) => r.detailSeq)).toEqual([5, 4, 3, 2, 1])
  })

  it('둘 다 비면 빈 목록', () => {
    expect(mergeRecentIssues([], [])).toEqual([])
  })
})
