import { describe, expect, it } from 'vitest'

import { checkGaps } from '../checkIntervals'
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

describe('checkGaps — 행별 직전 인증과의 간격', () => {
  it('🔴 첫 인증은 null 이다 — 0 을 주면 "0분 만에 도착" 과 섞인다', () => {
    const rows = [
      detail({ detailSeq: 1, orderNo: 1, checkDt: '2026-05-01T10:00:00' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: '2026-05-01T10:06:00' }),
    ]
    const gaps = checkGaps(rows)
    expect(gaps.get(1)).toBeNull()
    expect(gaps.get(2)).toBe(6 * 60)
  })

  it('🔴 시각 없는 행은 null 이고 건너뛴 뒤 간격이 이어진다', () => {
    const rows = [
      detail({ detailSeq: 1, orderNo: 1, checkDt: '2026-05-01T10:00:00' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: null, status: 3 }),
      detail({ detailSeq: 3, orderNo: 3, checkDt: '2026-05-01T10:10:00' }),
    ]
    const gaps = checkGaps(rows)
    expect(gaps.get(2)).toBeNull()
    // 미인증 지점을 건너뛴 **실제** 간격이다
    expect(gaps.get(3)).toBe(10 * 60)
  })

  it('🔴 orderNo 가 아니라 checkDt 순으로 뺀다', () => {
    const rows = [
      detail({ detailSeq: 1, orderNo: 1, checkDt: '2026-05-01T10:20:00' }),
      detail({ detailSeq: 2, orderNo: 2, checkDt: '2026-05-01T10:00:00' }),
    ]
    const gaps = checkGaps(rows)
    // 편성 순서로 빼면 음수가 나온다
    expect(gaps.get(2)).toBeNull()
    expect(gaps.get(1)).toBe(20 * 60)
  })
})
