import { describe, expect, it } from 'vitest'

import { ALL_VALUE } from '@/lib/listQuery'
import {
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  orderRange,
  parsePageNumber,
  toCourseHistoryListParams,
} from '../courseHistoryListParams'

/** URL 쿼리 → 서버 파라미터 변환 (`spec 036` T493·T501) */

describe('clampPageSize — 🔴 상한 100 을 한 곳에서 막는다', () => {
  it('상한을 넘기면 깎는다', () => {
    // spec 027 이 200 을 보내 실서버 조회가 통째로 400 이었고 화면에는
    // "순찰 기록이 없습니다" 가 떴다 — 장애가 빈 상태로 읽혔다
    expect(clampPageSize(200)).toBe(MAX_PAGE_SIZE)
    expect(clampPageSize(101)).toBe(MAX_PAGE_SIZE)
  })

  it('상한 이하는 그대로', () => {
    expect(clampPageSize(100)).toBe(100)
    expect(clampPageSize(15)).toBe(15)
  })

  it('비정수·0·음수·undefined 는 기본값으로 수렴한다', () => {
    expect(clampPageSize(0)).toBe(DEFAULT_PAGE_SIZE)
    expect(clampPageSize(-5)).toBe(DEFAULT_PAGE_SIZE)
    expect(clampPageSize(12.5)).toBe(DEFAULT_PAGE_SIZE)
    expect(clampPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE)
  })

  it('🔴 변환 함수를 거치면 상한을 넘길 수 없다', () => {
    expect(toCourseHistoryListParams(7, { size: '500' }).pageSize).toBe(MAX_PAGE_SIZE)
  })
})

describe('orderRange — 🔴 기간 순서를 보장한다', () => {
  it('뒤집혀 들어오면 swap 한다', () => {
    // from > to 는 에러가 아니라 200 + 0건이다(실측) — 화면에는 "이력 없음" 으로 보여
    // 사용자가 날짜를 잘못 골랐다는 것을 알 수 없다
    expect(orderRange('2026-05-07', '2026-05-01')).toEqual({
      fromDt: '2026-05-01',
      toDt: '2026-05-07',
    })
  })

  it('정상 순서는 그대로', () => {
    expect(orderRange('2026-05-01', '2026-05-07')).toEqual({
      fromDt: '2026-05-01',
      toDt: '2026-05-07',
    })
  })

  it('한쪽만 있으면 열린 구간으로 둔다', () => {
    expect(orderRange('2026-05-01', undefined)).toEqual({
      fromDt: '2026-05-01',
      toDt: undefined,
    })
  })

  it('형식이 아니면 필터 미적용', () => {
    expect(orderRange('2026-5-1', 'oops')).toEqual({ fromDt: undefined, toDt: undefined })
  })
})

describe('parsePageNumber — 1-based 유지', () => {
  it('1 미만·비정수·빈 값은 1페이지로 수렴한다', () => {
    // 서버는 pageNumber=0 에 400 을 준다
    expect(parsePageNumber('0')).toBe(1)
    expect(parsePageNumber('-3')).toBe(1)
    expect(parsePageNumber('abc')).toBe(1)
    expect(parsePageNumber(undefined)).toBe(1)
    expect(parsePageNumber('3')).toBe(3)
  })
})

describe('toCourseHistoryListParams', () => {
  it('🔴 "전체"와 빈 값은 키 자체를 보내지 않는다', () => {
    // "전체" 는 값이 아니라 필터 해제다(018 규약)
    const params = toCourseHistoryListParams(7, { course: ALL_VALUE, result: '', user: '  ' })
    expect(params.courseSeq).toBeUndefined()
    expect(params.eventType).toBeUndefined()
    expect(params.userName).toBeUndefined()
  })

  it('필터를 서버 파라미터 이름으로 옮긴다', () => {
    const params = toCourseHistoryListParams(7, {
      from: '2026-05-01',
      to: '2026-05-07',
      course: '12',
      result: '1',
      user: '박지우',
      page: '2',
      size: '15',
    })
    expect(params).toEqual({
      siteSeq: 7,
      fromDt: '2026-05-01',
      toDt: '2026-05-07',
      courseSeq: 12,
      eventType: 1,
      userName: '박지우',
      pageNumber: 2,
      pageSize: 15,
    })
  })

  it('🔴 모르는 결과 코드도 통과시킨다 — 서버에 있는 상태를 우리가 걸러선 안 된다', () => {
    // courseListParams 의 courseStatus 와 같은 판단(A1)
    expect(toCourseHistoryListParams(7, { result: '5' }).eventType).toBe(5)
  })

  it('정수가 아닌 필터는 미적용', () => {
    expect(toCourseHistoryListParams(7, { course: 'abc' }).courseSeq).toBeUndefined()
  })
})
