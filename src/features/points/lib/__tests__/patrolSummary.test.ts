import { describe, expect, it } from 'vitest'

import {
  SUMMARY_DAYS,
  summarizePatrolHistory,
  summaryFromDate,
  summaryToDate,
} from '../patrolSummary'
import type { PointHistoryRow } from '../../types'

/**
 * 🔴 **전용 집계 API 가 없어 클라이언트가 센다**(`spec 027` Phase 3). 그래서 경계를
 * 여기서 전부 고정한다 — 화면에서는 "숫자가 좀 이상한데" 로만 보여 원인을 못 찾는다.
 */

const row = (checkDt: string, overrides: Partial<PointHistoryRow> = {}): PointHistoryRow => ({
  detailSeq: 1,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  pointSeq: 1,
  pointName: '정문 입구',
  checkDt,
  userSeq: 101,
  userName: '김근무',
  authMethod: 9,
  authMethodName: 'QR',
  status: 4,
  statusName: '완료',
  overTimeYn: false,
  hasMemo: false,
  pauseTime: '00:00:00',
  ...overrides,
})

/** 기준일 고정 — 상대 날짜를 쓰면 자정에 깨지는 테스트가 된다 */
const TODAY = new Date('2026-10-09T12:00:00')

describe('summaryFromDate / summaryToDate', () => {
  it('30일 구간은 시작일 포함 30일이다 (오늘 포함)', () => {
    expect(summaryToDate(TODAY)).toBe('2026-10-09')
    // 09-10 ~ 10-09 = 30일
    expect(summaryFromDate(TODAY)).toBe('2026-09-10')
  })
})

describe('summarizePatrolHistory', () => {
  it('기록이 0건이면 총계 0 + 버킷은 날짜 수만큼 채워진다', () => {
    const result = summarizePatrolHistory([], TODAY)

    expect(result.total).toBe(0)
    expect(result.buckets).toHaveLength(SUMMARY_DAYS)
    expect(result.buckets.every((b) => b.count === 0)).toBe(true)
  })

  it('🔴 기록이 없는 날도 버킷에 남는다 — 빼면 "쉰 날" 이 안 보인다', () => {
    const result = summarizePatrolHistory([row('2026-10-09T09:00:00')], TODAY)

    expect(result.buckets).toHaveLength(SUMMARY_DAYS)
    expect(result.buckets.filter((b) => b.count === 0)).toHaveLength(SUMMARY_DAYS - 1)
  })

  it('버킷은 오래된 날 → 최근 날 순이다', () => {
    const result = summarizePatrolHistory([], TODAY)

    expect(result.buckets[0].date).toBe('2026-09-10')
    expect(result.buckets.at(-1)?.date).toBe('2026-10-09')
  })

  it('하루에 여러 건이면 그 날에 합산된다', () => {
    const result = summarizePatrolHistory(
      [
        row('2026-10-09T09:00:00'),
        row('2026-10-09T14:30:00'),
        row('2026-10-09T21:05:00'),
      ],
      TODAY
    )

    expect(result.total).toBe(3)
    expect(result.buckets.at(-1)).toEqual({ date: '2026-10-09', count: 3 })
  })

  it('경계 — 시작일(30일 전)은 포함된다', () => {
    const result = summarizePatrolHistory([row('2026-09-10T23:59:00')], TODAY)

    expect(result.total).toBe(1)
    expect(result.buckets[0].count).toBe(1)
  })

  it('🔴 경계 — 기간보다 하루 오래된 기록은 버린다', () => {
    const result = summarizePatrolHistory([row('2026-09-09T23:59:00')], TODAY)

    expect(result.total).toBe(0)
  })

  it('🔴 미래 날짜도 버린다 — 서버가 범위를 지켜줄 것으로 전제하지 않는다', () => {
    const result = summarizePatrolHistory([row('2026-10-10T00:01:00')], TODAY)

    expect(result.total).toBe(0)
  })

  it('🔴 깨진 날짜는 총계를 틀리게 하지 않고 버려진다', () => {
    const result = summarizePatrolHistory(
      [row('not-a-date'), row('2026-10-08T10:00:00')],
      TODAY
    )

    expect(result.total).toBe(1)
  })

  it('집계 기간을 바꿀 수 있다', () => {
    const result = summarizePatrolHistory([row('2026-10-05T10:00:00')], TODAY, 7)

    expect(result.buckets).toHaveLength(7)
    expect(result.total).toBe(1)
  })
})
