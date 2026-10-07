import { describe, expect, it } from 'vitest'

import {
  ALL_VALUE,
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
  toPageIndex,
  toPageNumber,
  toPointListParams,
} from '../pointListParams'

const SITE_SEQ = 7

describe('toPointListParams — 기본값', () => {
  it('쿼리가 비면 siteSeq와 페이징만 남는다', () => {
    expect(toPointListParams(SITE_SEQ, {})).toEqual({
      siteSeq: SITE_SEQ,
      searchKey: undefined,
      authMethod: undefined,
      useYn: undefined,
      pageNumber: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('pageSize 기본값은 서버 기본값(20)과 같다', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20)
  })
})

describe('toPointListParams — 검색', () => {
  it('검색어의 앞뒤 공백을 떼고 넘긴다', () => {
    expect(toPointListParams(SITE_SEQ, { search: '  정문  ' }).searchKey).toBe('정문')
  })

  it('공백만 있는 검색어는 보내지 않는다', () => {
    expect(toPointListParams(SITE_SEQ, { search: '   ' }).searchKey).toBeUndefined()
  })
})

describe('toPointListParams — 필터', () => {
  it('인증수단 코드를 숫자로 넘긴다', () => {
    expect(toPointListParams(SITE_SEQ, { authMethod: '9' }).authMethod).toBe(9)
  })

  it('"전체"는 서버 파라미터에서 빠진다', () => {
    expect(toPointListParams(SITE_SEQ, { authMethod: ALL_VALUE }).authMethod).toBeUndefined()
    expect(toPointListParams(SITE_SEQ, { useYn: ALL_VALUE }).useYn).toBeUndefined()
  })

  it('숫자가 아닌 인증수단은 필터를 적용하지 않는다 — 손으로 고친 URL 방어', () => {
    expect(toPointListParams(SITE_SEQ, { authMethod: 'abc' }).authMethod).toBeUndefined()
    expect(toPointListParams(SITE_SEQ, { authMethod: '9.5' }).authMethod).toBeUndefined()
  })

  it('사용여부는 true/false 문자열만 인정한다', () => {
    expect(toPointListParams(SITE_SEQ, { useYn: 'true' }).useYn).toBe(true)
    expect(toPointListParams(SITE_SEQ, { useYn: 'false' }).useYn).toBe(false)
    expect(toPointListParams(SITE_SEQ, { useYn: 'yes' }).useYn).toBeUndefined()
  })
})

describe('parsePageNumber', () => {
  it('URL의 page를 그대로 쓴다 — URL도 1-based다', () => {
    expect(parsePageNumber('3')).toBe(3)
  })

  it('1 미만은 1페이지로 수렴한다 — 서버는 pageNumber=0에 400을 준다', () => {
    expect(parsePageNumber('0')).toBe(1)
    expect(parsePageNumber('-2')).toBe(1)
  })

  it('비정수·빈값·없음은 1페이지로 수렴한다', () => {
    expect(parsePageNumber('abc')).toBe(1)
    expect(parsePageNumber('2.5')).toBe(1)
    expect(parsePageNumber('')).toBe(1)
    expect(parsePageNumber(undefined)).toBe(1)
  })
})

describe('1-based ↔ 0-based 변환', () => {
  it('첫 페이지는 pageNumber 1 ↔ pageIndex 0이다', () => {
    expect(toPageIndex(1)).toBe(0)
    expect(toPageNumber(0)).toBe(1)
  })

  it('왕복이 보존된다', () => {
    expect(toPageNumber(toPageIndex(5))).toBe(5)
    expect(toPageIndex(toPageNumber(4))).toBe(4)
  })
})
