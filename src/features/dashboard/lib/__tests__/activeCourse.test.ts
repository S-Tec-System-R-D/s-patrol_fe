import { describe, expect, it } from 'vitest'

import type { ActiveCourse } from '../../types'
import {
  checkedCount,
  elapsedRatio,
  nextPoint,
  overtimeMin,
  pointSteps,
  skippedCount,
  sortActiveCourses,
} from '../activeCourse'

/** `spec 067` — 진행 중 회차 계산(정렬 · 비율 · 다음 지점 · 건너뜀) */

const pts = (checked: number[]) =>
  checked.map((value, index) => ({ orderNo: index + 1, pointName: `P${index + 1}`, checked: value === 1 }))

const course = (overrides: Partial<ActiveCourse>): ActiveCourse => ({
  historySeq: 1,
  courseName: '코스',
  userName: '순찰자',
  swapped: false,
  startDt: '2026-10-30T09:00:00',
  elapsedMin: 10,
  standardMin: 30,
  points: pts([0, 0]),
  ...overrides,
})

describe('pointSteps', () => {
  it('마지막 인증 앞의 미인증 = 건너뜀, 뒤의 첫 지점 = 다음', () => {
    expect(pointSteps(pts([1, 1, 0, 1, 0, 0]))).toEqual(['done', 'done', 'skipped', 'done', 'next', 'pending'])
  })

  it('아무것도 안 찍었으면 1번이 다음', () => {
    expect(pointSteps(pts([0, 0, 0]))).toEqual(['next', 'pending', 'pending'])
  })

  it('다 찍었으면 다음이 없다', () => {
    expect(pointSteps(pts([1, 1]))).toEqual(['done', 'done'])
    expect(nextPoint(pts([1, 1]))).toBeNull()
  })
})

describe('nextPoint · skippedCount · checkedCount', () => {
  it('마지막 지점 직전이면 다음 = 마지막 지점', () => {
    expect(nextPoint(pts([1, 1, 0]))?.orderNo).toBe(3)
  })

  it('건너뜀과 인증 개수', () => {
    const points = pts([1, 0, 0, 1, 0])
    expect(skippedCount(points)).toBe(2)
    expect(checkedCount(points)).toBe(2)
  })
})

describe('elapsedRatio · overtimeMin', () => {
  it('기준 대비 경과', () => {
    expect(elapsedRatio(course({ elapsedMin: 15, standardMin: 30 }))).toBe(0.5)
    expect(overtimeMin(course({ elapsedMin: 58, standardMin: 45 }))).toBe(13)
    expect(overtimeMin(course({ elapsedMin: 20, standardMin: 45 }))).toBe(0)
  })

  it('기준이 0 이면 비교하지 않는다', () => {
    expect(elapsedRatio(course({ standardMin: 0 }))).toBe(0)
    expect(overtimeMin(course({ elapsedMin: 10, standardMin: 0 }))).toBe(0)
  })
})

describe('sortActiveCourses', () => {
  it('시간초과가 먼저, 그다음 경과 비율이 높은 순', () => {
    const sorted = sortActiveCourses([
      course({ historySeq: 1, elapsedMin: 2, standardMin: 25 }),
      course({ historySeq: 2, elapsedMin: 23, standardMin: 40 }),
      course({ historySeq: 3, elapsedMin: 58, standardMin: 45 }),
      course({ historySeq: 4, elapsedMin: 18, standardMin: 30 }),
    ])
    expect(sorted.map((item) => item.historySeq)).toEqual([3, 4, 2, 1])
  })
})
