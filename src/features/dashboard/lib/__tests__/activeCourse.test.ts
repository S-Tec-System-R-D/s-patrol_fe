import { describe, expect, it } from 'vitest'

import type { DashboardCourse } from '../../types'
import {
  checkedCount,
  currentUserName,
  elapsedMinAt,
  elapsedRatio,
  hasStandard,
  nextPoint,
  overtimeMin,
  pointSteps,
  skippedCount,
  sortActiveCourses,
} from '../activeCourse'

/** `spec 068` — 진행 중 회차 계산(서버 `status` 단계 · 경과 · 기준 없음 · 정렬) */

const pts = (statuses: number[]) =>
  statuses.map((status, index) => ({
    detailSeq: index + 1,
    pointSeq: index + 1,
    orderNo: index + 1,
    pointName: `P${index + 1}`,
    status,
    checkDt: null,
  }))

const course = (overrides: Partial<DashboardCourse>): DashboardCourse => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: '코스',
  startDt: '2026-11-03T09:00:00',
  elapsedSec: 600,
  pausedYn: false,
  totalMin: 30,
  handoverCount: 0,
  users: [{ userSeq: 1, userName: '순찰자' }],
  points: pts([0, 0]),
  ...overrides,
})

const RECEIVED = 1_000_000
const minutes = (n: number) => n * 60_000

describe('pointSteps — 서버 status 그대로', () => {
  it('4 인증 · 3 건너뜀 · 1 다음 · 0 대기', () => {
    expect(pointSteps(pts([4, 3, 4, 1, 0]))).toEqual(['done', 'skipped', 'done', 'next', 'pending'])
  })

  it('2 순찰제외는 대기와 같다', () => {
    expect(pointSteps(pts([2]))).toEqual(['pending'])
  })

  it('미인증이 인증 앞에 있어도 status 가 0 이면 건너뜀이 아니다(067 계산 삭제)', () => {
    expect(pointSteps(pts([0, 4, 1]))).toEqual(['pending', 'done', 'next'])
  })
})

describe('nextPoint · skippedCount · checkedCount', () => {
  it('다음 = status 1 지점, 없으면 null', () => {
    expect(nextPoint(pts([4, 1, 0]))?.orderNo).toBe(2)
    expect(nextPoint(pts([4, 3]))).toBeNull()
  })

  it('건너뜀 = status 3 개수, 인증 = status 4 개수', () => {
    const points = pts([4, 3, 4, 3, 1, 0])
    expect(skippedCount(points)).toBe(2)
    expect(checkedCount(points)).toBe(2)
  })
})

describe('elapsedMinAt', () => {
  it('받은 뒤 지난 시간을 더한다(분 버림)', () => {
    const c = course({ elapsedSec: 10 * 60 + 30 })
    expect(elapsedMinAt(c, RECEIVED, RECEIVED)).toBe(10)
    expect(elapsedMinAt(c, RECEIVED, RECEIVED + 30_000)).toBe(11)
    expect(elapsedMinAt(c, RECEIVED, RECEIVED + minutes(5))).toBe(15)
  })

  it('멈춘 회차(pausedYn)는 늘지 않는다', () => {
    const c = course({ elapsedSec: 600, pausedYn: true })
    expect(elapsedMinAt(c, RECEIVED, RECEIVED + minutes(5))).toBe(10)
  })

  it('지금이 받은 시각보다 앞이면 응답 값 그대로', () => {
    expect(elapsedMinAt(course({ elapsedSec: 600 }), RECEIVED, RECEIVED - minutes(1))).toBe(10)
  })
})

describe('기준 · 시간초과', () => {
  it('경과 > 기준이면 넘긴 분', () => {
    const c = course({ totalMin: 30 })
    expect(overtimeMin(c, 30)).toBe(0)
    expect(overtimeMin(c, 43)).toBe(13)
    expect(elapsedRatio(c, 15)).toBe(0.5)
  })

  it('totalMin 0 = 기준 없음 — 시간초과 · 비율을 판단하지 않는다', () => {
    const c = course({ totalMin: 0 })
    expect(hasStandard(c)).toBe(false)
    expect(overtimeMin(c, 120)).toBe(0)
    expect(elapsedRatio(c, 120)).toBe(0)
  })
})

describe('currentUserName', () => {
  it('users 마지막이 지금 순찰자, 비면 null', () => {
    expect(
      currentUserName(
        course({
          users: [
            { userSeq: 1, userName: '처음' },
            { userSeq: 2, userName: '지금' },
          ],
        })
      )
    ).toBe('지금')
    expect(currentUserName(course({ users: [] }))).toBeNull()
  })
})

describe('sortActiveCourses', () => {
  it('시간초과 먼저, 그다음 경과 비율 순 — 기준 없음은 비율 0', () => {
    const courses = [
      course({ historySeq: 1, elapsedSec: 18 * 60, totalMin: 30 }),
      course({ historySeq: 2, elapsedSec: 58 * 60, totalMin: 45 }),
      course({ historySeq: 3, elapsedSec: 90 * 60, totalMin: 0 }),
      course({ historySeq: 4, elapsedSec: 35 * 60, totalMin: 40 }),
    ]
    expect(sortActiveCourses(courses, RECEIVED, RECEIVED).map((c) => c.historySeq)).toEqual([2, 4, 1, 3])
  })

  it('흐른 시간으로 시간초과가 되면 위로 올라간다', () => {
    const courses = [
      course({ historySeq: 1, elapsedSec: 25 * 60, totalMin: 50 }),
      course({ historySeq: 2, elapsedSec: 28 * 60, totalMin: 30 }),
      course({ historySeq: 3, elapsedSec: 40 * 60, totalMin: 30, pausedYn: true }),
    ]
    // 지금: 3(초과 · 멈춤) → 2(93%) → 1(50%)
    expect(sortActiveCourses(courses, RECEIVED, RECEIVED).map((c) => c.historySeq)).toEqual([3, 2, 1])
    // 5분 뒤: 2 도 초과(33 > 30) → 둘 다 초과면 비율 순(3: 40/30 · 2: 33/30)
    expect(sortActiveCourses(courses, RECEIVED, RECEIVED + minutes(5)).map((c) => c.historySeq)).toEqual([3, 2, 1])
  })
})
