import { describe, expect, it } from 'vitest'
import type { SimCoursePoint, SimPoint } from '../../types'
import {
  applyPreset,
  buildRows,
  canHaveEvent,
  describePlan,
  emptyDraft,
  hasEvent,
  isActiveRow,
  PRESET_MEMO,
  setEvent,
  START_ROW,
  totalWaitSeconds,
  type EventContext,
} from '../plan'

const coursePoint = (pointSeq: number, orderNo: number, authMethod = 9, courseMin = 1): SimCoursePoint => ({
  coursePointSeq: 100 + pointSeq,
  pointSeq,
  gpsLat: null,
  gpsLng: null,
  pointName: `지점 ${pointSeq}`,
  authMethod,
  orderNo,
  useYn: true,
  courseMin,
})

const sitePoint = (pointSeq: number, authMethod: number, nfcTagId: string | null): SimPoint => ({
  pointSeq,
  pointName: `지점 ${pointSeq}`,
  memo: null,
  authMethod,
  authMethodName: authMethod === 10 ? 'NFC' : 'QR',
  usedCount: 0,
  useYn: true,
  nfcTagId,
  lastPatrolDt: null,
})

const fresh = buildRows(
  [coursePoint(3, 3), coursePoint(1, 1), coursePoint(2, 2, 10)],
  [sitePoint(1, 9, null), sitePoint(2, 10, 'TAG'), sitePoint(3, 9, null)],
  10
)
const draft = emptyDraft(fresh)
const ctx: EventContext = { intervalSeconds: 10, handoverTo: '600102' }
const noOne: EventContext = { intervalSeconds: 10, handoverTo: null }

describe('buildRows', () => {
  it('코스 순서대로 전부 인증 · 같은 간격으로 만든다', () => {
    expect(fresh.map((row) => [row.pointSeq, row.action, row.waitSeconds, row.memo])).toEqual([
      [1, 'certify', 10, null],
      [2, 'certify', 10, null],
      [3, 'certify', 10, null],
    ])
  })

  it('태그 값이 없는 NFC 지점은 인증할 수 없어 건너뛰기로 둔다', () => {
    const rows = buildRows([coursePoint(1, 1, 10)], [sitePoint(1, 10, null)], 10)
    expect(rows[0]).toMatchObject({ canCertify: false, action: 'skip' })
    // 미인증을 끌 수 없다
    expect(canHaveEvent(emptyDraft(rows), 0, 'skip')).toBe(false)
  })
})

describe('setEvent — 줄에서 상황을 켜고 끈다', () => {
  it('어느 줄이든 고른 줄에 켜진다', () => {
    const next = setEvent(draft, 2, 'skip', true, ctx)
    expect(next.rows.map((row) => row.action)).toEqual(['certify', 'certify', 'skip'])
  })

  it('시간초과 — 켜면 제한 시간을 넘겨 기다리고, 끄면 기본 간격으로 돌아간다', () => {
    const on = setEvent(draft, 1, 'overtime', true, ctx)
    expect(on.rows[1].waitSeconds).toBe(70)
    expect(hasEvent(on, 1, 'overtime')).toBe(true)
    expect(setEvent(on, 1, 'overtime', false, ctx).rows[1].waitSeconds).toBe(10)
  })

  it('특이사항 — 기본 문구로 켠다. 미인증을 켜면 그 줄의 특이사항이 지워지고 다시 켤 수 없다', () => {
    const memo = setEvent(draft, 0, 'memo', true, ctx)
    expect(memo.rows[0].memo).toBe(PRESET_MEMO)

    const skipped = setEvent(memo, 0, 'skip', true, ctx)
    expect(skipped.rows[0].memo).toBeNull()
    expect(canHaveEvent(skipped, 0, 'memo')).toBe(false)
    expect(setEvent(skipped, 0, 'memo', true, ctx)).toBe(skipped)
  })

  it('교대 — 그 줄에 근무자를 채운다. 넘겨줄 사람이 없으면 켜지지 않는다', () => {
    expect(setEvent(draft, 0, 'handover', true, ctx).rows[0].handoverTo).toBe('600102')
    expect(setEvent(draft, 0, 'handover', true, noOne)).toBe(draft)
  })

  it('마지막 지점에는 교대 · 종료를 둘 수 없다 — 처리하는 순간 순찰이 닫힌다', () => {
    expect(canHaveEvent(draft, 2, 'handover')).toBe(false)
    expect(canHaveEvent(draft, 2, 'end')).toBe(false)
    expect(setEvent(draft, 2, 'end', true, ctx)).toBe(draft)
  })

  it('종료 — 그 줄 뒤는 실행되지 않는다. 종료가 먼저라 그 줄의 교대는 지운다', () => {
    const handed = setEvent(draft, 0, 'handover', true, ctx)
    const ended = setEvent(handed, 0, 'end', true, ctx)

    expect(ended.endAfterIndex).toBe(0)
    expect(ended.rows[0].handoverTo).toBeNull()
    expect(canHaveEvent(ended, 0, 'handover')).toBe(false)
    expect([0, 1, 2].map((index) => isActiveRow(ended, index))).toEqual([true, false, false])
    expect(setEvent(ended, 0, 'end', false, ctx).endAfterIndex).toBeNull()
  })

  it('순찰 시작 줄 — 교대와 종료만 둘 수 있다', () => {
    expect(canHaveEvent(draft, START_ROW, 'skip')).toBe(false)

    const handed = setEvent(draft, START_ROW, 'handover', true, ctx)
    expect(handed.startHandoverTo).toBe('600102')
    expect(hasEvent(handed, START_ROW, 'handover')).toBe(true)

    const ended = setEvent(handed, START_ROW, 'end', true, ctx)
    expect(ended).toMatchObject({ endAfterIndex: START_ROW, startHandoverTo: null })
    expect(isActiveRow(ended, 0)).toBe(false)
  })
})

describe('applyPreset — 정해진 자리에 한 번에 얹는다', () => {
  it('미인증 = 가운데 지점', () => {
    expect(applyPreset('skip', draft, fresh, ctx).rows.map((row) => row.action)).toEqual([
      'certify',
      'skip',
      'certify',
    ])
  })

  it('교대 · 도중 종료 = 가운데 지점의 앞 지점 뒤', () => {
    expect(applyPreset('handover', draft, fresh, ctx).rows[0].handoverTo).toBe('600102')
    expect(applyPreset('end', draft, fresh, ctx).endAfterIndex).toBe(0)
  })

  it('특이사항 = 첫 인증 지점 / 시간초과 = 첫 지점', () => {
    expect(applyPreset('memo', draft, fresh, ctx).rows[0].memo).toBe(PRESET_MEMO)
    expect(applyPreset('overtime', draft, fresh, ctx).rows[0].waitSeconds).toBe(70)
  })

  it('겹쳐 누르면 쌓이고, 정상 완료가 처음으로 되돌린다', () => {
    const mixed = applyPreset('handover', applyPreset('overtime', draft, fresh, ctx), fresh, ctx)
    expect(describePlan(mixed)).toBe('시간초과 · 교대')
    expect(applyPreset('normal', mixed, fresh, ctx)).toEqual(draft)
  })

  it('지점이 하나뿐이면 교대 · 도중 종료는 순찰 시작 줄에 놓인다', () => {
    const single = buildRows([coursePoint(1, 1)], [sitePoint(1, 9, null)], 10)
    const one = emptyDraft(single)
    expect(applyPreset('end', one, single, ctx).endAfterIndex).toBe(START_ROW)
    expect(applyPreset('handover', one, single, ctx).startHandoverTo).toBe('600102')
  })
})

describe('describePlan · totalWaitSeconds', () => {
  it('아무것도 켜지 않으면 정상 완료', () => {
    expect(describePlan(draft)).toBe('정상 완료')
  })

  it('종료 지점 뒤의 줄은 세지 않는다', () => {
    const ended = setEvent(setEvent(draft, 2, 'skip', true, ctx), 0, 'end', true, ctx)
    expect(describePlan(ended)).toBe('도중 종료')
    expect(totalWaitSeconds(ended, 5)).toBe(10)
  })

  it('시작하자마자 종료하면 기다리지 않는다', () => {
    expect(totalWaitSeconds(setEvent(draft, START_ROW, 'end', true, ctx), 5)).toBe(0)
  })

  it('대기 합계에 교대 멈춤을 더한다 — 시작 줄의 교대도 센다', () => {
    const twice = setEvent(setEvent(draft, START_ROW, 'handover', true, ctx), 1, 'handover', true, ctx)
    expect(totalWaitSeconds(twice, 5)).toBe(40)
  })
})
