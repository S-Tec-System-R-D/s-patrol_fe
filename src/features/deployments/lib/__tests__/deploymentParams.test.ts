import { describe, expect, it } from 'vitest'

import { DEPLOYMENT_DIRECTION } from '../../types/deployment'
import {
  DEPLOYMENT_PAGE_SIZE,
  parseDeploymentTab,
  toHistoryParams,
  toRequestListParams,
} from '../deploymentParams'

/** URL 쿼리 → 배치 API 파라미터 (`spec 039` T631 · T649g 탭 3개) */

describe('parseDeploymentTab', () => {
  it('🔴 기본은 요청 탭이다 — 처리할 일이 먼저다', () => {
    expect(parseDeploymentTab(undefined)).toBe('requests')
    expect(parseDeploymentTab('requests')).toBe('requests')
    expect(parseDeploymentTab('xyz')).toBe('requests')
  })

  it('전출·전입을 인정한다', () => {
    expect(parseDeploymentTab('out')).toBe('out')
    expect(parseDeploymentTab('in')).toBe('in')
  })
})

describe('toHistoryParams', () => {
  it('탭을 direction 코드로 옮긴다 — out 0 / in 1 (가정 계약)', () => {
    expect(toHistoryParams(7, 'out').direction).toBe(DEPLOYMENT_DIRECTION.OUT)
    expect(toHistoryParams(7, 'in').direction).toBe(DEPLOYMENT_DIRECTION.IN)
  })

  it('사업장 · 1-based 페이지 · 행 수를 싣는다', () => {
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
