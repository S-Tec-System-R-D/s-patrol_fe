import { describe, expect, it } from 'vitest'

import { SUMMARY_DAYS, summarizePatrolHistory, summaryFromDate, summaryToDate, toPatrolTicks, formatSinceLabel } from '../patrolSummary'
import type { PointHistoryRow } from '@/features/course-history/types'

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
  it('2주 구간은 시작일 포함 14일이다 (오늘 포함)', () => {
    expect(summaryToDate(TODAY)).toBe('2026-10-09')
    // 09-26 ~ 10-09 = 14일
    expect(summaryFromDate(TODAY)).toBe('2026-09-26')
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

    expect(result.buckets[0].date).toBe('2026-09-26')
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

  it('경계 — 시작일(14일 전)은 포함된다', () => {
    const result = summarizePatrolHistory([row('2026-09-26T23:59:00')], TODAY)

    expect(result.total).toBe(1)
    expect(result.buckets[0].count).toBe(1)
  })

  it('🔴 경계 — 기간보다 하루 오래된 기록은 버린다', () => {
    const result = summarizePatrolHistory([row('2026-09-25T23:59:00')], TODAY)

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

/**
 * 🔴 **인증 / 대상 분리** (`spec 031` 보강, 실측 2026-10-14).
 *
 * `GetPointHistory` 를 필터 없이 부르면 **미완료(3)와 완료(4)가 섞여서** 온다
 * (실측: 사업장 69건 중 미완료 43건). 🔴 **미완료 행도 `checkDt` 를 갖는다** —
 * "날짜가 없어 자연히 빠질 것" 이라는 가정이 틀렸고, 그래서 "2주 인증" 이 부풀려져 있었다.
 * 기존 테스트가 **완료 행만** 다뤄 이 결함을 못 잡았다.
 */
describe('summarizePatrolHistory — 인증(완료)과 대상(전체)을 가른다', () => {
  const today = new Date('2026-10-14T10:00:00')

  it('🔴 미완료(status 3)는 인증으로 세지 않는다 — 대상에는 든다', () => {
    const summary = summarizePatrolHistory(
      [
        row('2026-10-14T09:00:00', { status: 4, statusName: '완료' }),
        row('2026-10-13T09:00:00', { status: 3, statusName: '미완료' }),
        row('2026-10-12T09:00:00', { status: 3, statusName: '미완료' }),
      ],
      today
    )

    expect(summary.total).toBe(1)
    expect(summary.attempted).toBe(3)
  })

  it('🔴 미완료는 **날짜 버킷에도 들어가지 않는다** — 안 한 날이 한 것처럼 보이면 안 된다', () => {
    const summary = summarizePatrolHistory(
      [row('2026-10-13T09:00:00', { status: 3, statusName: '미완료' })],
      today
    )

    expect(summary.buckets.every((bucket) => bucket.count === 0)).toBe(true)
  })

  it('기간 밖 행은 대상에서도 빠진다 — 분모가 부풀면 비율이 낮아 보인다', () => {
    const summary = summarizePatrolHistory(
      [
        row('2026-10-14T09:00:00', { status: 4 }),
        row('2026-01-01T09:00:00', { status: 3 }), // 14일 밖
      ],
      today
    )

    expect(summary.total).toBe(1)
    expect(summary.attempted).toBe(1)
  })

  it('전부 완료면 인증 = 대상이다', () => {
    const summary = summarizePatrolHistory(
      [row('2026-10-14T09:00:00', { status: 4 }), row('2026-10-13T09:00:00', { status: 4 })],
      today
    )

    expect(summary.total).toBe(2)
    expect(summary.attempted).toBe(2)
  })
})

/** 🔴 **점등 배열과 "얼마 전"** (`spec 031`) */
describe('toPatrolTicks', () => {
  const today = new Date('2026-10-14T10:00:00')

  it('인증한 날만 켠다 — 안 한 날도 **칸은 남긴다**', () => {
    const summary = summarizePatrolHistory(
      [row('2026-10-14T09:00:00', { status: 4 }), row('2026-10-12T09:00:00', { status: 4 })],
      today,
      3
    )

    // 오래된 날 → 최근 날: 10/12 ✓, 10/13 ✗, 10/14 ✓
    expect(toPatrolTicks(summary)).toEqual([true, false, true])
  })

  it('기록이 없으면 전부 꺼져 있다 — 길이는 그대로다', () => {
    expect(toPatrolTicks(summarizePatrolHistory([], today, 14))).toHaveLength(14)
    expect(toPatrolTicks(summarizePatrolHistory([], today, 14)).every((on) => !on)).toBe(true)
  })
})

describe('formatSinceLabel', () => {
  const now = new Date('2026-10-14T10:00:00')

  it('한 시간 안이면 "방금"', () => {
    expect(formatSinceLabel('2026-10-14T09:30:00', now)).toBe('방금')
  })

  it('하루 안이면 시간 단위', () => {
    expect(formatSinceLabel('2026-10-14T01:00:00', now)).toBe('9시간 전')
  })

  it('하루가 넘으면 일 단위', () => {
    expect(formatSinceLabel('2026-10-11T10:00:00', now)).toBe('3일 전')
  })

  it('🔴 미래 시각이면 아무 말도 하지 않는다 — `-2시간 전` 은 사실이 아니라 데이터 이상이다', () => {
    expect(formatSinceLabel('2026-10-14T12:00:00', now)).toBeNull()
  })

  it('값이 없거나 깨졌으면 null', () => {
    expect(formatSinceLabel(null, now)).toBeNull()
    expect(formatSinceLabel('깨진 값', now)).toBeNull()
  })
})
