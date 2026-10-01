import { describe, expect, it } from 'vitest'

import {
  isWithinDateRange,
  parseDateRangeQuery,
  toDateRangeQuery,
} from '@/lib/dateRangeQuery'

describe('parseDateRangeQuery', () => {
  it('YYYY-MM-DD 문자열을 Date로 바꾼다', () => {
    const { from, to } = parseDateRangeQuery({ from: '2026-05-01', to: '2026-05-30' })
    expect(from).toEqual(new Date(2026, 4, 1))
    expect(to).toEqual(new Date(2026, 4, 30))
  })

  it('키가 없으면 undefined', () => {
    expect(parseDateRangeQuery({})).toEqual({ from: undefined, to: undefined })
  })

  it('빈 문자열은 undefined', () => {
    expect(parseDateRangeQuery({ from: '', to: '' })).toEqual({ from: undefined, to: undefined })
  })

  it.each(['2026-13-45', '2026-02-30', 'abc', '20260501'])(
    '잘못된 형식(%s)은 undefined로 떨어뜨린다',
    (value) => {
      expect(parseDateRangeQuery({ from: value }).from).toBeUndefined()
    }
  )

  it('한쪽만 잘못돼도 나머지는 살린다', () => {
    const { from, to } = parseDateRangeQuery({ from: '2026-05-01', to: 'abc' })
    expect(from).toEqual(new Date(2026, 4, 1))
    expect(to).toBeUndefined()
  })
})

describe('toDateRangeQuery', () => {
  it('Date를 YYYY-MM-DD로 바꾼다', () => {
    expect(toDateRangeQuery({ from: new Date(2026, 4, 1, 9, 30), to: new Date(2026, 4, 30) })).toEqual(
      { from: '2026-05-01', to: '2026-05-30' }
    )
  })

  it('빈 범위는 양쪽 모두 undefined', () => {
    expect(toDateRangeQuery({})).toEqual({ from: undefined, to: undefined })
  })

  it('문자열 → Date → 문자열 왕복에서 값이 보존된다', () => {
    const query = { from: '2026-05-01', to: '2026-05-30' }
    expect(toDateRangeQuery(parseDateRangeQuery(query))).toEqual(query)
  })
})

describe('isWithinDateRange', () => {
  const range = { from: new Date(2026, 4, 1), to: new Date(2026, 4, 30) }

  it('범위 안이면 true', () => {
    expect(isWithinDateRange(new Date(2026, 4, 15, 13, 0), range)).toBe(true)
  })

  it('시작일 당일은 시각이 이르더라도 포함된다', () => {
    expect(isWithinDateRange(new Date(2026, 4, 1, 0, 1), range)).toBe(true)
  })

  it('종료일 당일은 시각이 늦더라도 포함된다', () => {
    expect(isWithinDateRange(new Date(2026, 4, 30, 23, 59), range)).toBe(true)
  })

  it('범위 밖이면 false', () => {
    expect(isWithinDateRange(new Date(2026, 3, 30, 23, 59), range)).toBe(false)
    expect(isWithinDateRange(new Date(2026, 5, 1, 0, 1), range)).toBe(false)
  })

  it('from만 있으면 그 이후를 모두 통과시킨다', () => {
    const fromOnly = { from: new Date(2026, 4, 1) }
    expect(isWithinDateRange(new Date(2027, 0, 1), fromOnly)).toBe(true)
    expect(isWithinDateRange(new Date(2026, 3, 1), fromOnly)).toBe(false)
  })

  it('빈 범위는 모두 통과시킨다', () => {
    expect(isWithinDateRange(new Date(2026, 4, 15), {})).toBe(true)
  })
})
