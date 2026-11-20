import { describe, expect, it } from 'vitest'
import type { CourseHistoryRow } from '@/features/course-history/types'
import { countByCourse, countByHour, isCapped, RECENT_COURSE_CAP } from '../todayStats'

const TODAY = '2026-11-20'

/** 집계가 읽는 세 값만 채운 행 */
const row = (courseSeq: number, courseName: string, startDt: string): CourseHistoryRow =>
  ({ courseSeq, courseName, startDt }) as CourseHistoryRow

describe('countByHour — 오늘 시작한 회차를 시간대별로', () => {
  it('0~23시 24칸이고 시작 시각의 시로 센다', () => {
    const hours = countByHour(
      [row(1, 'A', `${TODAY}T00:10:00`), row(1, 'A', `${TODAY}T09:00:00`), row(2, 'B', `${TODAY}T09:59:59`), row(2, 'B', `${TODAY}T23:30:00`)],
      TODAY
    )
    expect(hours).toHaveLength(24)
    expect(hours[0]).toBe(1)
    expect(hours[9]).toBe(2)
    expect(hours[23]).toBe(1)
    expect(hours.reduce((sum, n) => sum + n, 0)).toBe(4)
  })

  it('🔴 어제 시작한 회차는 세지 않는다 — 어제~오늘을 받아 오지만 오늘 것만', () => {
    const hours = countByHour([row(1, 'A', '2026-11-19T23:50:00'), row(1, 'A', `${TODAY}T00:05:00`)], TODAY)
    expect(hours.reduce((sum, n) => sum + n, 0)).toBe(1)
    expect(hours[23]).toBe(0)
  })

  it('시각을 읽을 수 없는 행은 세지 않는다', () => {
    expect(countByHour([row(1, 'A', TODAY)], TODAY).reduce((sum, n) => sum + n, 0)).toBe(0)
  })

  it('기록이 없으면 전부 0', () => {
    expect(countByHour([], TODAY)).toEqual(Array(24).fill(0))
  })
})

describe('countByCourse — 오늘 시작한 회차를 코스별로', () => {
  const rows = [
    row(1, '본관 외곽', `${TODAY}T01:00:00`),
    row(1, '본관 외곽', `${TODAY}T05:00:00`),
    row(2, '지하주차장', `${TODAY}T02:00:00`),
    row(1, '본관 외곽', '2026-11-19T22:00:00'),
  ]

  it('많은 순으로 — 어제 것은 빼고', () => {
    expect(countByCourse(rows, TODAY)).toEqual([
      { courseSeq: 1, courseName: '본관 외곽', count: 2 },
      { courseSeq: 2, courseName: '지하주차장', count: 1 },
    ])
  })

  it('🔴 코스 목록을 주면 오늘 한 번도 안 돈 코스도 0회로 넣는다', () => {
    const result = countByCourse(rows, TODAY, [
      { courseSeq: 1, courseName: '본관 외곽' },
      { courseSeq: 2, courseName: '지하주차장' },
      { courseSeq: 3, courseName: '별관 창고' },
    ])
    expect(result.map((c) => [c.courseName, c.count])).toEqual([
      ['본관 외곽', 2],
      ['지하주차장', 1],
      ['별관 창고', 0],
    ])
  })

  it('목록에 없는 코스(지워졌거나 목록이 잘린 경우)는 기록의 이름으로 넣는다', () => {
    const result = countByCourse(rows, TODAY, [{ courseSeq: 2, courseName: '지하주차장' }])
    expect(result.find((c) => c.courseSeq === 1)).toEqual({ courseSeq: 1, courseName: '본관 외곽', count: 2 })
  })

  it('같은 횟수면 이름 순', () => {
    const result = countByCourse([], TODAY, [
      { courseSeq: 2, courseName: '나' },
      { courseSeq: 1, courseName: '가' },
    ])
    expect(result.map((c) => c.courseName)).toEqual(['가', '나'])
  })
})

describe('isCapped — 받은 건수가 서버 상한에 닿았나', () => {
  it('100건이면 닿았다 — 더 있을 수 있다', () => {
    expect(isCapped(Array.from({ length: RECENT_COURSE_CAP }, () => row(1, 'A', `${TODAY}T00:00:00`)))).toBe(true)
    expect(isCapped(Array.from({ length: RECENT_COURSE_CAP - 1 }, () => row(1, 'A', `${TODAY}T00:00:00`)))).toBe(false)
  })
})
