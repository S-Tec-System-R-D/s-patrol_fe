import { describe, expect, it } from 'vitest'

import { filterCourseHistory } from '@/features/patrol-zones/lib/filterCourseHistory'
import {
  ALL_VALUE,
  courseOptions,
  courseResultOptions,
  isCourseResult,
} from '@/features/patrol-zones/lib/courseHistoryOptions'
import type { ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'

const row = (
  name: string,
  startedAt: Date,
  result: ZonePatrolType['result']
): ZonePatrolType => ({
  name,
  startedAt,
  endedAt: startedAt,
  result,
  points: [],
})

const rows: ZonePatrolType[] = [
  row('A동 순찰구역', new Date(2026, 4, 1, 9, 0), 'COMPLETE'),
  row('B동 순찰구역', new Date(2026, 4, 5, 10, 0), 'INCOMPLETE'),
  row('A동 순찰구역', new Date(2026, 4, 10, 11, 0), 'IN_PROGRESS'),
  row('C동 순찰구역', new Date(2026, 5, 1, 9, 0), 'COMPLETE'),
]

const names = (result: ZonePatrolType[]) => result.map((r) => r.name)

describe('filterCourseHistory', () => {
  it('빈 필터는 전체를 통과시킨다', () => {
    expect(filterCourseHistory(rows, { range: {} })).toHaveLength(4)
  })

  it('기간으로 좁힌다 (양 끝 포함)', () => {
    const result = filterCourseHistory(rows, {
      range: { from: new Date(2026, 4, 1), to: new Date(2026, 4, 10) },
    })
    expect(result).toHaveLength(3)
    expect(result.every((r) => r.startedAt.getMonth() === 4)).toBe(true)
  })

  it('코스로 좁힌다', () => {
    expect(names(filterCourseHistory(rows, { range: {}, courseId: 'A동 순찰구역' }))).toEqual([
      'A동 순찰구역',
      'A동 순찰구역',
    ])
  })

  it('결과로 좁힌다', () => {
    expect(filterCourseHistory(rows, { range: {}, result: 'COMPLETE' })).toHaveLength(2)
  })

  it('여러 조건을 AND로 결합한다', () => {
    const result = filterCourseHistory(rows, {
      range: { from: new Date(2026, 4, 1), to: new Date(2026, 4, 31) },
      courseId: 'A동 순찰구역',
      result: 'COMPLETE',
    })
    expect(result).toHaveLength(1)
    expect(result[0].startedAt).toEqual(new Date(2026, 4, 1, 9, 0))
  })

  it('알 수 없는 result는 해당 조건만 무시한다', () => {
    expect(filterCourseHistory(rows, { range: {}, result: 'GARBAGE' })).toHaveLength(4)
  })

  it('알 수 없는 result여도 다른 조건은 그대로 적용된다', () => {
    const result = filterCourseHistory(rows, { range: {}, courseId: 'B동 순찰구역', result: 'xxx' })
    expect(names(result)).toEqual(['B동 순찰구역'])
  })

  it('없는 코스를 넘기면 0건', () => {
    expect(filterCourseHistory(rows, { range: {}, courseId: '없는 코스' })).toHaveLength(0)
  })
})

describe('courseHistoryOptions', () => {
  it('코스 선택지는 중복을 제거하고 맨 앞에 전체를 둔다', () => {
    expect(courseOptions(rows)).toEqual([
      { value: ALL_VALUE, label: '전체' },
      { value: 'A동 순찰구역', label: 'A동 순찰구역' },
      { value: 'B동 순찰구역', label: 'B동 순찰구역' },
      { value: 'C동 순찰구역', label: 'C동 순찰구역' },
    ])
  })

  it('결과 선택지는 뱃지맵의 라벨을 쓰고 맨 앞에 전체를 둔다', () => {
    expect(courseResultOptions).toEqual([
      { value: ALL_VALUE, label: '전체' },
      { value: 'COMPLETE', label: '완료' },
      { value: 'INCOMPLETE', label: '미완료' },
      { value: 'IN_PROGRESS', label: '진행중' },
    ])
  })

  it('전체 센티넬은 빈 문자열이 아니다 (Radix Select 제약)', () => {
    expect(ALL_VALUE).not.toBe('')
  })

  it('isCourseResult는 아는 값만 통과시킨다', () => {
    expect(isCourseResult('COMPLETE')).toBe(true)
    expect(isCourseResult('PROCESSING')).toBe(false)
  })
})
