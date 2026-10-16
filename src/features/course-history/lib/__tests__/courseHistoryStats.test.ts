import { describe, expect, it } from 'vitest'

import { courseHistoryStats, formatRate } from '../courseHistoryStats'
import type { CourseHistoryRow } from '../../types'

/**
 * 프론트 집계 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **서버에 집계 엔드포인트가 없어 우리가 더한다**(사용자 결정 2026-10-12). 그래서
 * 여기서 고정하는 것은 **실측에서 나온 예외들이 평균·비율을 망가뜨리지 않는가** 다:
 * 소요시간을 읽을 수 없는 행 · 분모 0 · 한 페이지로 다 못 받은 경우.
 */

const row = (overrides: Partial<CourseHistoryRow> = {}): CourseHistoryRow => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  startDt: '2026-10-11T02:40:00',
  endDt: '2026-10-11T03:24:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 3,
  checkedCount: 3,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:44:00',
  hasMemo: false,
  userList: [{ userSeq: 21, userName: '박성민' }],
  ...overrides,
})

describe('courseHistoryStats — 평균 소요', () => {
  it('🔴 시 단위 행이 섞여도 맞는다 — 분으로 읽으면 평균이 무너진다', () => {
    const stats = courseHistoryStats(
      [row({ actualElapsedTime: '00:40:00' }), row({ actualElapsedTime: '02:00:00' })],
      2
    )

    expect(stats.avgElapsedSec).toBe((40 * 60 + 120 * 60) / 2)
  })

  it('🔴 소요시간을 읽을 수 없는 행은 **제외**한다 — 0 으로 섞으면 평균이 내려간다', () => {
    const stats = courseHistoryStats(
      [row({ actualElapsedTime: '00:40:00' }), row({ actualElapsedTime: '' })],
      2
    )

    expect(stats.avgElapsedSec).toBe(40 * 60)
  })

  it('🔴 전부 읽을 수 없으면 null 이다 — 0 을 평균으로 적지 않는다', () => {
    const stats = courseHistoryStats([row({ actualElapsedTime: '이상' })], 1)

    expect(stats.avgElapsedSec).toBeNull()
  })

  it('이력이 없으면 null 이다', () => {
    expect(courseHistoryStats([], 0).avgElapsedSec).toBeNull()
  })
})

describe('courseHistoryStats — 인증률', () => {
  it('분자·분모를 합산한다', () => {
    const stats = courseHistoryStats(
      [row({ checkedCount: 3, pointCount: 3 }), row({ checkedCount: 2, pointCount: 3 })],
      2
    )

    expect(stats.checkedSum).toBe(5)
    expect(stats.pointSum).toBe(6)
    expect(stats.authRate).toBeCloseTo(5 / 6)
  })

  it('🔴 분모가 0 이면 null 이다 — 0% 는 "하나도 못 했다" 로 읽힌다', () => {
    // 지점 0개 코스를 돈 이력이 있으면 실제로 일어난다
    const stats = courseHistoryStats([row({ checkedCount: 0, pointCount: 0 })], 1)

    expect(stats.authRate).toBeNull()
  })

  it('🔴 완료인데 인증 0 인 행도 그대로 더한다 — 상태로 보정하지 않는다 (실측)', () => {
    // 실측(2026-10-12, 사업장 10): status 1(완료) + checkedCount 0
    const stats = courseHistoryStats([row({ status: 1, checkedCount: 0, pointCount: 1 })], 1)

    expect(stats.authRate).toBe(0)
  })
})

describe('courseHistoryStats — 표본', () => {
  it('runCount 는 서버 totalCount 다 — 받은 행 수가 아니다', () => {
    const stats = courseHistoryStats([row()], 46)

    expect(stats.runCount).toBe(46)
    expect(stats.sampledCount).toBe(1)
  })

  it('🔴 한 페이지로 다 못 받으면 partial 이다 — 화면이 "최근 N건 기준" 을 밝혀야 한다', () => {
    expect(courseHistoryStats([row()], 46).partial).toBe(true)
    expect(courseHistoryStats([row()], 1).partial).toBe(false)
  })
})

describe('formatRate', () => {
  it('소수 한 자리 퍼센트로 적는다', () => {
    expect(formatRate(0.967)).toBe('96.7%')
    expect(formatRate(1)).toBe('100.0%')
  })

  it('🔴 null 은 — 다. 0% 와 구분한다', () => {
    expect(formatRate(null)).toBe('-')
    expect(formatRate(0)).toBe('0.0%')
  })
})

/**
 * 🔴 **구성 값** (`spec 031` 확장) — 분포 바와 범위 바의 재료.
 *
 * 외부 비교(전월 대비) 대신 **이미 받아 둔 응답 안의 분포**를 쓴다. 그래서 서버 요청이
 * 늘지 않는다.
 */
describe('courseHistoryStats — 상태 분포와 최단·최장', () => {
  it('완료(1)·진행중(0)·미완료(2)를 센다', () => {
    const stats = courseHistoryStats(
      [row({ status: 1 }), row({ status: 1 }), row({ status: 0 }), row({ status: 2 })],
      4
    )

    expect(stats.statusCounts).toEqual({ done: 2, inProgress: 1, failed: 1 })
  })

  it('🔴 모르는 상태값은 어느 칸에도 넣지 않는다 — 임의로 "미완료" 로 보내면 없는 실패가 생긴다', () => {
    const stats = courseHistoryStats([row({ status: 1 }), row({ status: 9 })], 2)

    expect(stats.statusCounts).toEqual({ done: 1, inProgress: 0, failed: 0 })
  })

  it('소요시간 최단·최장을 뽑는다 — 읽을 수 없는 행은 빼고', () => {
    const stats = courseHistoryStats(
      [
        row({ actualElapsedTime: '00:42:00' }),
        row({ actualElapsedTime: '00:58:00' }),
        row({ actualElapsedTime: 'bad' }),
      ],
      3
    )

    expect(stats.minElapsedSec).toBe(42 * 60)
    expect(stats.maxElapsedSec).toBe(58 * 60)
  })

  it('🔴 읽을 수 있는 소요시간이 없으면 최단·최장이 null 이다 — 0 은 "0초 순찰" 이 된다', () => {
    const stats = courseHistoryStats([row({ actualElapsedTime: 'bad' })], 1)

    expect(stats.minElapsedSec).toBeNull()
    expect(stats.maxElapsedSec).toBeNull()
  })

  it('⚠️ 상태 분포의 합은 runCount 와 다를 수 있다 — 받아 온 행만 센 값이다', () => {
    // `partial` 이면 표본 기준이다. 화면이 둘을 같은 수로 취급하면 안 된다
    const stats = courseHistoryStats([row({ status: 1 })], 50)

    expect(stats.runCount).toBe(50)
    expect(stats.statusCounts.done).toBe(1)
    expect(stats.partial).toBe(true)
  })
})
