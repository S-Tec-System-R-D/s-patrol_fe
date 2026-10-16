import { describe, expect, it } from 'vitest'

import { courseAverage } from '../courseAverage'
import type { CourseHistoryRow } from '../../types'

/** 코스 평균 소요시간 (`spec 036` T498·T501) */

const row = (overrides: Partial<CourseHistoryRow>): CourseHistoryRow => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  startDt: '2026-05-01T09:00:00',
  endDt: '2026-05-01T09:30:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 3,
  checkedCount: 3,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:30:00',
  hasMemo: false,
  userList: [{ userSeq: 21, userName: '박성민' }],
  ...overrides,
})

describe('courseAverage', () => {
  it('완료 행의 소요시간을 평균낸다', () => {
    const result = courseAverage(
      [
        row({ actualElapsedTime: '00:30:00' }),
        row({ actualElapsedTime: '00:40:00' }),
        row({ actualElapsedTime: '00:50:00' }),
      ],
      3
    )
    expect(result.averageSeconds).toBe(40 * 60)
    expect(result.countedRuns).toBe(3)
    expect(result.partial).toBe(false)
  })

  it('🔴 시 단위를 분으로 읽지 않는다', () => {
    // 실측에 '02:17:40' 이 있다 — 앞 두 자리만 읽으면 2시간이 2분이 된다
    const result = courseAverage([row({ actualElapsedTime: '02:17:40' })], 1)
    expect(result.averageSeconds).toBe(2 * 3600 + 17 * 60 + 40)
  })

  it('🔴 읽을 수 없는 소요시간은 빼고 센다', () => {
    // 평균을 0 으로 끌어내리지 않는다
    const result = courseAverage(
      [row({ actualElapsedTime: '00:30:00' }), row({ actualElapsedTime: '' })],
      2
    )
    expect(result.averageSeconds).toBe(30 * 60)
    expect(result.countedRuns).toBe(1)
  })

  it('🔴 셀 수 있는 행이 없으면 null 이다 — 0 이 아니다', () => {
    // 0 을 돌려주면 "0분 걸린 순찰" 과 섞인다
    expect(courseAverage([], 0).averageSeconds).toBeNull()
    expect(courseAverage([row({ actualElapsedTime: 'x' })], 1).averageSeconds).toBeNull()
  })

  it('🔴 totalCount 가 100 을 넘으면 partial — 화면이 "최근 100회 평균" 이라고 적는다', () => {
    // pageSize 상한이 100 이라 페이지를 루프하지 않는다
    expect(courseAverage([row({})], 101).partial).toBe(true)
    expect(courseAverage([row({})], 100).partial).toBe(false)
  })
})
