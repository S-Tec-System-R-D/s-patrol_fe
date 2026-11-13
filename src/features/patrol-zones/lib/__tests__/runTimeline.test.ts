import { describe, expect, it } from 'vitest'

import type { CheckDetailRow } from '@/features/course-history/types'

import { orderLabel, runTimeline } from '../runTimeline'

const row = (orderNo: number, over: Partial<CheckDetailRow> = {}): CheckDetailRow => ({
  detailSeq: orderNo,
  pointSeq: 10 + orderNo,
  pointName: `지점 ${orderNo}`,
  status: 4,
  checkDt: null,
  authMethod: 9,
  checkUserSeq: null,
  userName: null,
  orderNo,
  gpsLat: null,
  gpsLng: null,
  overtimeYn: null,
  memos: [],
  ...over,
})

const START = '2026-11-13T09:10:00'

describe('runTimeline (spec 077)', () => {
  it('첫 인증은 순찰 시작부터, 다음은 직전 인증부터 잰다 — 바로 앞이면 출발 순번을 적지 않는다', () => {
    const steps = runTimeline(
      [
        row(1, { checkDt: '2026-11-13T09:15:00' }),
        row(2, { checkDt: '2026-11-13T09:23:00' }),
      ],
      START,
      false
    )

    expect(steps.map((s) => s.moveSeconds)).toEqual([300, 480])
    expect(steps.map((s) => s.movedFrom)).toEqual([null, null])
  })

  it('🔴 시각 없는 지점을 건너뛴 이동이면 출발 순번을 준다 — (06→08)', () => {
    const steps = runTimeline(
      [
        row(6, { checkDt: '2026-11-13T09:37:00' }),
        row(7, { status: 3, checkDt: null }),
        row(8, { checkDt: '2026-11-13T09:46:00' }),
      ],
      START,
      false
    )

    expect(steps[1].moveSeconds).toBeNull()
    expect(steps[2]).toMatchObject({ moveSeconds: 540, movedFrom: 6 })
    expect(orderLabel(6)).toBe('06')
  })

  it('첫 지점을 건너뛰면 출발은 시작(0)이다', () => {
    const steps = runTimeline(
      [row(1, { status: 3 }), row(2, { checkDt: '2026-11-13T09:20:00' })],
      START,
      false
    )

    expect(steps[1]).toMatchObject({ moveSeconds: 600, movedFrom: 0 })
    expect(orderLabel(0)).toBe('시작')
  })

  it('🔴 순번은 orderNo 그대로 — 응답이 섞여 와도 순번 순으로 놓는다', () => {
    const steps = runTimeline([row(3), row(1), row(2)], START, false)

    expect(steps.map((s) => s.row.orderNo)).toEqual([1, 2, 3])
  })

  it('진행 중이면 마지막 인증 다음의 대기 지점이 다음 지점 · 마지막 인증이 latest', () => {
    const steps = runTimeline(
      [
        row(1, { checkDt: '2026-11-13T09:15:00' }),
        row(2, { checkDt: '2026-11-13T09:20:00' }),
        row(3, { status: 0 }),
        row(4, { status: 0 }),
      ],
      START,
      true
    )

    expect(steps.map((s) => s.isNext)).toEqual([false, false, true, false])
    expect(steps.map((s) => s.isLatest)).toEqual([false, true, false, false])
  })

  it('끝난 회차에는 다음 지점 · latest 가 없다', () => {
    const steps = runTimeline([row(1, { checkDt: '2026-11-13T09:15:00' }), row(2, { status: 0 })], START, false)

    expect(steps.some((s) => s.isNext || s.isLatest)).toBe(false)
  })
})
