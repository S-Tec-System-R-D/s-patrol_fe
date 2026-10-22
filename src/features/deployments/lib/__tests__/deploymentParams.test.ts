import { describe, expect, it } from 'vitest'

import { DEPLOYMENT_PAGE_SIZE, parseDeploymentTab, toHistoryParams } from '../deploymentParams'

/** URL 쿼리 → 배치 API 파라미터 (`spec 039` T631 · `spec 042` T718) */

describe('parseDeploymentTab', () => {
  it('🔴 기본은 요청 탭이다 — 처리할 일이 먼저다', () => {
    expect(parseDeploymentTab(undefined)).toBe('requests')
    expect(parseDeploymentTab('requests')).toBe('requests')
    expect(parseDeploymentTab('xyz')).toBe('requests')
  })

  it('복귀·전출·전입을 인정한다', () => {
    expect(parseDeploymentTab('returns')).toBe('returns')
    expect(parseDeploymentTab('out')).toBe('out')
    expect(parseDeploymentTab('in')).toBe('in')
  })
})

describe('toHistoryParams', () => {
  it('사업장 · 1-based 페이지 · 행 수를 싣는다 — direction·status 는 없다', () => {
    expect(toHistoryParams(7, '3')).toEqual({
      siteSeq: 7,
      pageNumber: 3,
      pageSize: DEPLOYMENT_PAGE_SIZE,
    })
  })

  it('이름 검색은 userName 으로 싣고, 공백은 뺀다', () => {
    expect(toHistoryParams(7, undefined, '오준').userName).toBe('오준')
    expect(toHistoryParams(7, undefined, '').userName).toBeUndefined()
  })

  it('깨진 페이지는 1 로 수렴한다', () => {
    expect(toHistoryParams(7, '0').pageNumber).toBe(1)
    expect(toHistoryParams(7, 'abc').pageNumber).toBe(1)
  })
})
