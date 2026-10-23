import { describe, expect, it } from 'vitest'

import type { SiteDetail } from '../../types/site'
import { isHealthCheckEmpty, toExceptionRequest, toHHmm, toHHmmss } from '../healthCheck'

/** 헬스체크 순수 함수 (`spec 044` T786) */

const detail = (overrides: Partial<SiteDetail> = {}): SiteDetail => ({
  siteSeq: 1,
  siteName: '사업장',
  tel: null,
  address: null,
  healthCheckYn: false,
  healthCheckInterval: 30,
  healthCheckTimeout: 10,
  healthCheckRetry: 3,
  healthCheckStartTime: '08:00:00',
  healthCheckEndTime: '20:00:00',
  exceptionTime: [],
  userCount: 0,
  courseCount: 0,
  pointCount: 0,
  ...overrides,
})

describe('isHealthCheckEmpty', () => {
  it('값이 다 있으면 비어 있지 않다(반복 0 도 값이다)', () => {
    expect(isHealthCheckEmpty(detail())).toBe(false)
    expect(isHealthCheckEmpty(detail({ healthCheckRetry: 0 }))).toBe(false)
  })

  it('🔴 최소 생성 사업장(0 · 0 · null 3개)은 비어 있다', () => {
    expect(
      isHealthCheckEmpty(
        detail({
          healthCheckInterval: 0,
          healthCheckTimeout: 0,
          healthCheckRetry: null,
          healthCheckStartTime: null,
          healthCheckEndTime: null,
        })
      )
    ).toBe(true)
  })

  it.each([
    { healthCheckInterval: 0 },
    { healthCheckTimeout: 0 },
    { healthCheckRetry: null },
    { healthCheckStartTime: null },
    { healthCheckEndTime: null },
  ])('하나만 비어도 비어 있다 %o', (overrides) => {
    expect(isHealthCheckEmpty(detail(overrides))).toBe(true)
  })
})

describe('시각 변환', () => {
  it('HH:mm:ss → HH:mm(초 버림) · null 은 빈 문자열', () => {
    expect(toHHmm('08:16:39')).toBe('08:16')
    expect(toHHmm(null)).toBe('')
  })

  it('🔴 일 단위로 저장된 값(25.00:00:00)은 읽지 않는다(B-53)', () => {
    expect(toHHmm('25.00:00:00')).toBe('')
  })

  it('HH:mm → HH:mm:00', () => {
    expect(toHHmmss('12:30')).toBe('12:30:00')
  })
})

describe('toExceptionRequest', () => {
  it('🔴 기존 행은 detailSeq 유지 · 새 행은 0 · 시각은 HH:mm:00', () => {
    expect(
      toExceptionRequest([
        { detailSeq: 7, start: '12:00', end: '13:00' },
        { start: '15:00', end: '15:30' },
      ])
    ).toEqual([
      { detailSeq: 7, exceptionStartTime: '12:00:00', exceptionEndTime: '13:00:00' },
      { detailSeq: 0, exceptionStartTime: '15:00:00', exceptionEndTime: '15:30:00' },
    ])
  })

  it('전부 지우면 빈 배열(= 서버에서 전부 삭제)', () => {
    expect(toExceptionRequest([])).toEqual([])
  })
})
