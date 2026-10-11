import { describe, expect, it } from 'vitest'

import {
  ALL_VALUE,
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
  toCourseListParams,
  toPageIndex,
  toPageNumber,
} from '../courseListParams'

const SITE_SEQ = 7

describe('toCourseListParams — 기본값', () => {
  it('쿼리가 비면 siteSeq와 페이징만 남는다', () => {
    expect(toCourseListParams(SITE_SEQ, {})).toEqual({
      siteSeq: SITE_SEQ,
      searchKey: undefined,
      useYn: undefined,
      switchYn: undefined,
      courseStatus: undefined,
      pageNumber: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('pageSize 기본값은 서버 기본값(20)과 같다', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20)
  })
})

describe('toCourseListParams — 검색', () => {
  it('검색어의 앞뒤 공백을 떼고 넘긴다', () => {
    expect(toCourseListParams(SITE_SEQ, { search: '  A동  ' }).searchKey).toBe('A동')
  })

  it('공백만 있는 검색어는 보내지 않는다', () => {
    expect(toCourseListParams(SITE_SEQ, { search: '   ' }).searchKey).toBeUndefined()
  })
})

describe('toCourseListParams — 필터', () => {
  it('사용여부·교대는 true/false 문자열만 인정한다', () => {
    expect(toCourseListParams(SITE_SEQ, { useYn: 'true' }).useYn).toBe(true)
    expect(toCourseListParams(SITE_SEQ, { switchYn: 'false' }).switchYn).toBe(false)
    expect(toCourseListParams(SITE_SEQ, { switchYn: 'yes' }).switchYn).toBeUndefined()
  })

  it('"전체"는 서버 파라미터에서 빠진다', () => {
    expect(toCourseListParams(SITE_SEQ, { useYn: ALL_VALUE }).useYn).toBeUndefined()
    expect(toCourseListParams(SITE_SEQ, { switchYn: ALL_VALUE }).switchYn).toBeUndefined()
    expect(toCourseListParams(SITE_SEQ, { status: ALL_VALUE }).courseStatus).toBeUndefined()
  })

  it('🔴 URL 키는 status, 서버 파라미터는 courseStatus 다', () => {
    const params = toCourseListParams(SITE_SEQ, { status: '0' })
    expect(params.courseStatus).toBe(0)
    expect(params).not.toHaveProperty('status')
  })

  it('🔴 상태 코드를 사전으로 검증하지 않는다 — 모르는 코드도 그대로 넘긴다', () => {
    // 테스트 DB 에 0 만 있어 전체 값 체계가 미확인이다(OQ-3).
    // 우리가 막으면 서버에 있는 상태를 걸러 버린다.
    expect(toCourseListParams(SITE_SEQ, { status: '7' }).courseStatus).toBe(7)
  })

  it('숫자가 아닌 상태는 필터를 적용하지 않는다 — 손으로 고친 URL 방어', () => {
    expect(toCourseListParams(SITE_SEQ, { status: 'abc' }).courseStatus).toBeUndefined()
    expect(toCourseListParams(SITE_SEQ, { status: '1.5' }).courseStatus).toBeUndefined()
  })
})

describe('parsePageNumber', () => {
  it('1 이상의 정수만 통과한다', () => {
    expect(parsePageNumber('3')).toBe(3)
  })

  it('🔴 0·음수·비정수·빈 값은 1로 수렴한다 — 서버는 pageNumber=0 에 400 을 준다', () => {
    expect(parsePageNumber('0')).toBe(1)
    expect(parsePageNumber('-2')).toBe(1)
    expect(parsePageNumber('2.5')).toBe(1)
    expect(parsePageNumber('abc')).toBe(1)
    expect(parsePageNumber(undefined)).toBe(1)
  })
})

describe('1-based ↔ 0-based 변환', () => {
  it('서버/URL 의 1페이지는 AppPagination 의 0 이다', () => {
    expect(toPageIndex(1)).toBe(0)
    expect(toPageNumber(0)).toBe(1)
  })

  it('왕복하면 원래 값이다', () => {
    expect(toPageNumber(toPageIndex(5))).toBe(5)
  })
})
