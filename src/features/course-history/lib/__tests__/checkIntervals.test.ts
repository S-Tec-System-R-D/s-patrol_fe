import { describe, expect, it } from 'vitest'

import { checkIntervals } from '../checkIntervals'
import type { CheckDetailRow } from '../../types'

/** 구간 간격 계산 (`spec 036` T499·T501) */

const detail = (overrides: Partial<CheckDetailRow>): CheckDetailRow => ({
  detailSeq: 1,
  pointSeq: 60,
  pointName: '정문 입구',
  status: 4,
  checkDt: '2026-05-01T10:00:00',
  authMethod: 10,
  checkUserSeq: 21,
  userName: '박성민',
  orderNo: 1,
  gpsLat: 37.4936289,
  gpsLng: 127.0780667,
  overtimeYn: false,
  memos: [],
  ...overrides,
})

describe('checkIntervals', () => {
  it('평균·최단·최장을 센다', () => {
    const result = checkIntervals([
      detail({ detailSeq: 1, orderNo: 1, checkDt: '2026-05-01T10:00:00' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: '2026-05-01T10:06:00' }), // +6분
      detail({ detailSeq: 3, orderNo: 3, checkDt: '2026-05-01T10:14:00' }), // +8분
    ])
    expect(result.intervalCount).toBe(2)
    expect(result.shortestSeconds).toBe(6 * 60)
    expect(result.longestSeconds).toBe(8 * 60)
    expect(result.averageSeconds).toBe(7 * 60)
    expect(result.skippedRows).toBe(0)
  })

  it('🔴 checkDt 가 없는 행은 빼고, 뺀 건수를 돌려준다', () => {
    // null 을 0 으로 읽으면 간격이 거대값이 된다. 조용히 빼면 8개 지점 코스의 평균이
    // 2개로 계산됐는데도 그냥 평균처럼 보인다
    const result = checkIntervals([
      detail({ detailSeq: 1, orderNo: 1, checkDt: '2026-05-01T10:00:00' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: null, status: 3 }),
      detail({ detailSeq: 3, orderNo: 3, checkDt: null, status: 0 }),
      detail({ detailSeq: 4, orderNo: 4, checkDt: '2026-05-01T10:10:00' }),
    ])
    expect(result.skippedRows).toBe(2)
    expect(result.intervalCount).toBe(1)
    expect(result.averageSeconds).toBe(10 * 60)
  })

  it('🔴 orderNo 가 아니라 checkDt 로 정렬한다', () => {
    // ① 서버가 orderNo 중복을 저장한다(spec 032) ② 간격은 실제로 찍힌 순서의 차이다.
    // 편성 순서로 빼면 음수가 나온다
    const result = checkIntervals([
      detail({ detailSeq: 1, orderNo: 1, checkDt: '2026-05-01T10:20:00' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: '2026-05-01T10:00:00' }),
    ])
    expect(result.averageSeconds).toBe(20 * 60)
    expect(result.shortestSeconds).toBeGreaterThan(0)
  })

  it('인증이 1건 이하면 간격을 만들 수 없다 — null', () => {
    expect(checkIntervals([]).averageSeconds).toBeNull()
    expect(checkIntervals([detail({})]).averageSeconds).toBeNull()
    expect(checkIntervals([detail({})]).intervalCount).toBe(0)
  })

  it('읽을 수 없는 시각은 제외 건수에 들어간다', () => {
    const result = checkIntervals([
      detail({ detailSeq: 1, orderNo: 1, checkDt: 'not-a-date' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: '2026-05-01T10:00:00' }),
    ])
    expect(result.skippedRows).toBe(1)
    expect(result.averageSeconds).toBeNull()
  })
})
