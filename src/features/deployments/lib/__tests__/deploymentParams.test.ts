import { describe, expect, it } from 'vitest'

import { DEPLOYMENT_DIRECTION } from '../../types/deployment'
import {
  DEPLOYMENT_PAGE_SIZE,
  parseHistoryTab,
  toHistoryParams,
  toRequestListParams,
} from '../deploymentParams'

/** URL 쿼리 → 배치 API 파라미터 (`spec 039` T631) */

describe('parseHistoryTab', () => {
  it('in 이 아니면 전부 out 이다 (014 동작 유지)', () => {
    expect(parseHistoryTab('in')).toBe('in')
    expect(parseHistoryTab('out')).toBe('out')
    expect(parseHistoryTab(undefined)).toBe('out')
    expect(parseHistoryTab('xyz')).toBe('out')
  })
})

describe('toHistoryParams', () => {
  it('탭을 direction 코드로 옮긴다 — out 0 / in 1 (가정 계약)', () => {
    expect(toHistoryParams(7, 'out').direction).toBe(DEPLOYMENT_DIRECTION.OUT)
    expect(toHistoryParams(7, 'in').direction).toBe(DEPLOYMENT_DIRECTION.IN)
  })

  it('사업장 · 1-based 페이지 · 고정 행 수를 싣는다', () => {
    expect(toHistoryParams(7, 'in', '3')).toEqual({
      siteSeq: 7,
      direction: DEPLOYMENT_DIRECTION.IN,
      pageNumber: 3,
      pageSize: DEPLOYMENT_PAGE_SIZE,
    })
  })

  it('깨진 페이지는 1 로 수렴한다', () => {
    expect(toHistoryParams(7, 'out', '0').pageNumber).toBe(1)
    expect(toHistoryParams(7, 'out', 'abc').pageNumber).toBe(1)
  })
})

describe('toRequestListParams', () => {
  it('사업장 · 페이지 · 행 수를 싣는다', () => {
    expect(toRequestListParams(7, '2')).toEqual({
      siteSeq: 7,
      pageNumber: 2,
      pageSize: DEPLOYMENT_PAGE_SIZE,
    })
    expect(toRequestListParams(7).pageNumber).toBe(1)
  })
})
