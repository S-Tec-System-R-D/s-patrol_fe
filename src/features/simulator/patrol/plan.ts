import type { SimCoursePoint, SimPoint } from '../types'

/**
 * 순찰 계획 (`spec 082` US3).
 *
 * 순찰 시뮬은 **실행 엔진 하나**다 — 지점별로 "무엇을 할지" 적은 계획을 실행한다.
 *
 * 🔴 **상황은 그 줄에서 일어난다**(사용자 결정 2026-11-18). 교대 · 종료는 "그 지점을 처리한 **뒤**"다 —
 * 웹 대시보드가 교대를 **직전에 인증한 지점**에 표시하므로(`lastOrderNo`) 줄과 화면이 같은 자리가 된다.
 * 첫 지점보다 앞에서 일어나는 일(시작하자마자 교대 · 인증 0개로 종료)은 **"순찰 시작" 줄**에 둔다.
 * 마지막 지점은 처리하는 순간 서버가 순찰을 닫으므로 그 줄에는 교대 · 종료를 둘 수 없다.
 */
export type PointAction = 'certify' | 'skip'

export interface PlanRow {
  pointSeq: number
  pointName: string
  /** 9 QR · 10 NFC */
  authMethod: number
  /** 이 지점의 제한 시간(분) */
  courseMin: number
  /** 인증값이 있는가 — 태그 없는 NFC 지점은 건너뛸 수밖에 없다 */
  canCertify: boolean
  action: PointAction
  /** 이 지점을 처리하기 전에 기다리는 시간(초) — 실제로 기다린다. 제한 시간을 넘기면 시간초과 */
  waitSeconds: number
  /** 특이사항 — 인증할 때 함께 보낸다. 끄면 `null`(건너뛰는 지점에는 붙이지 않는다) */
  memo: string | null
  /** 이 지점을 처리한 **뒤** 교대받을 근무자 아이디. 없으면 `null` */
  handoverTo: string | null
}

/** "순찰 시작" 줄 — 첫 지점보다 앞 */
export const START_ROW = -1

/** 계획 중 표에서 고치는 부분 */
export interface PlanDraft {
  rows: PlanRow[]
  /** 시작하자마자(첫 지점 전에) 교대받을 근무자 */
  startHandoverTo: string | null
  /** 이 순번(0부터)의 지점을 처리한 **뒤** 도중 종료한다. `START_ROW` 면 인증 0개로 종료, 끝까지 가면 `null` */
  endAfterIndex: number | null
}

export interface PatrolPlan extends PlanDraft {
  /** 순찰을 시작하는 근무자 */
  workerLoginId: string
  siteSeq: number
  courseSeq: number
}

/** 줄에서 켜고 끄는 상황 */
export type RowEvent = 'skip' | 'memo' | 'overtime' | 'handover' | 'end'

export type PresetId = 'normal' | RowEvent

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'normal', label: '정상 완료' },
  { id: 'skip', label: '미인증' },
  { id: 'end', label: '도중 종료' },
  { id: 'memo', label: '특이사항' },
  { id: 'overtime', label: '시간초과' },
  { id: 'handover', label: '교대' },
]

/** 시간초과가 제한 시간 위에 얹는 여유(초) */
const OVERTIME_MARGIN_SECONDS = 10
export const PRESET_MEMO = '시뮬 특이사항'

export const emptyDraft = (rows: PlanRow[]): PlanDraft => ({
  rows,
  startHandoverTo: null,
  endAfterIndex: null,
})

/** 코스 편성에서 "전부 인증"인 기본 줄을 만든다 */
export const buildRows = (
  coursePoints: SimCoursePoint[],
  sitePoints: SimPoint[],
  intervalSeconds: number
): PlanRow[] =>
  [...coursePoints]
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((point) => {
      const sitePoint = sitePoints.find((item) => item.pointSeq === point.pointSeq)
      // QR 은 서버가 코드를 만들어 두므로 항상 인증할 수 있다. NFC 는 태그 값이 있어야 한다
      const canCertify = point.authMethod !== 10 || Boolean(sitePoint?.nfcTagId)
      return {
        pointSeq: point.pointSeq,
        pointName: point.pointName,
        authMethod: point.authMethod,
        courseMin: point.courseMin,
        canCertify,
        action: canCertify ? 'certify' : 'skip',
        waitSeconds: intervalSeconds,
        memo: null,
        handoverTo: null,
      }
    })

export const isOvertime = (row: PlanRow): boolean => row.waitSeconds > row.courseMin * 60

/** 그 줄에 그 상황이 켜져 있는가. `index` 가 `START_ROW` 면 "순찰 시작" 줄 */
export const hasEvent = (draft: PlanDraft, index: number, event: RowEvent): boolean => {
  if (event === 'end') return draft.endAfterIndex === index
  if (index === START_ROW) return event === 'handover' && draft.startHandoverTo !== null
  const row = draft.rows[index]
  switch (event) {
    case 'skip':
      return row.action === 'skip'
    case 'memo':
      return row.memo !== null
    case 'overtime':
      return isOvertime(row)
    case 'handover':
      return row.handoverTo !== null
  }
}

/**
 * 그 줄에 그 상황을 **둘 수 있는가**.
 * - 시작 줄: 교대 · 종료만
 * - 마지막 지점: 교대 · 종료 불가(처리하는 순간 순찰이 닫힌다)
 * - 종료를 켠 줄: 교대 불가(종료가 먼저다)
 * - 건너뛰는 지점: 특이사항 불가 / 인증값이 없는 지점: 건너뛰기를 끌 수 없다
 */
export const canHaveEvent = (draft: PlanDraft, index: number, event: RowEvent): boolean => {
  if (index === START_ROW) return event === 'handover' ? draft.endAfterIndex !== START_ROW : event === 'end'
  const row = draft.rows[index]
  const isLast = index === draft.rows.length - 1
  switch (event) {
    case 'skip':
      return row.canCertify
    case 'memo':
      return row.action === 'certify'
    case 'overtime':
      return true
    case 'handover':
      return !isLast && draft.endAfterIndex !== index
    case 'end':
      return !isLast
  }
}

/** 실행되는 줄인가 — 종료 지점 뒤의 줄은 실행되지 않는다 */
export const isActiveRow = (draft: PlanDraft, index: number): boolean =>
  draft.endAfterIndex === null || index <= draft.endAfterIndex

export interface EventContext {
  /** 시간초과를 끌 때 되돌릴 기본 간격(초) */
  intervalSeconds: number
  /** 교대를 켤 때 채울 근무자 — 없으면 교대는 켜지지 않는다 */
  handoverTo: string | null
}

const patchRow = (draft: PlanDraft, index: number, patch: Partial<PlanRow>): PlanDraft => ({
  ...draft,
  rows: draft.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
})

/** 그 줄의 상황을 켜거나 끈다 — 켤 때 값을 채운다(시간초과 = 제한 시간 + 여유, 특이사항 = 기본 문구) */
export const setEvent = (
  draft: PlanDraft,
  index: number,
  event: RowEvent,
  on: boolean,
  context: EventContext
): PlanDraft => {
  if (on && !canHaveEvent(draft, index, event)) return draft

  if (event === 'end') {
    if (!on) return { ...draft, endAfterIndex: null }
    // 종료가 먼저다 — 그 줄의 교대는 지운다
    const cleared =
      index === START_ROW ? { ...draft, startHandoverTo: null } : patchRow(draft, index, { handoverTo: null })
    return { ...cleared, endAfterIndex: index }
  }

  if (event === 'handover') {
    const to = on ? context.handoverTo : null
    if (on && to === null) return draft
    return index === START_ROW ? { ...draft, startHandoverTo: to } : patchRow(draft, index, { handoverTo: to })
  }

  const row = draft.rows[index]
  switch (event) {
    case 'skip':
      // 건너뛰는 지점에는 메모를 붙이지 않는다
      return patchRow(draft, index, on ? { action: 'skip', memo: null } : { action: 'certify' })
    case 'memo':
      return patchRow(draft, index, { memo: on ? PRESET_MEMO : null })
    case 'overtime':
      return patchRow(draft, index, {
        waitSeconds: on ? row.courseMin * 60 + OVERTIME_MARGIN_SECONDS : context.intervalSeconds,
      })
  }
}

/**
 * 상단 프리셋 — **지금 계획 위에** 정해진 자리에 한 번에 얹는다(반복 시험용). `normal` 만 처음으로 되돌린다.
 * 자리: 미인증 = 가운데 지점 / 특이사항 = 첫 인증 지점 / 시간초과 = 첫 지점 / 교대 · 도중 종료 = 가운데 지점의 앞 지점 뒤.
 */
export const applyPreset = (
  preset: PresetId,
  draft: PlanDraft,
  fresh: PlanRow[],
  context: EventContext
): PlanDraft => {
  const { rows } = draft
  if (rows.length === 0) return draft
  const middle = Math.min(rows.length - 1, Math.max(1, Math.floor(rows.length / 2)))
  // 가운데 지점 바로 앞에서 끊는다 — 지점이 하나뿐이면 "순찰 시작" 줄이 된다
  const breakAfter = rows.length === 1 ? START_ROW : middle - 1

  switch (preset) {
    case 'normal':
      return emptyDraft(fresh)
    case 'skip':
      return setEvent(draft, middle, 'skip', true, context)
    case 'memo': {
      const index = rows.findIndex((row) => row.action === 'certify')
      return index < 0 ? draft : setEvent(draft, index, 'memo', true, context)
    }
    case 'overtime':
      return setEvent(draft, 0, 'overtime', true, context)
    case 'handover':
      return setEvent(draft, breakAfter, 'handover', true, context)
    case 'end':
      return setEvent(draft, breakAfter, 'end', true, context)
  }
}

/** 실행 목록에 보일 한 줄 — 계획에 든 특징만 적는다 */
export const describePlan = (draft: PlanDraft): string => {
  const active = draft.rows.filter((_, index) => isActiveRow(draft, index))
  const traits: string[] = []
  const skipped = active.filter((row) => row.action === 'skip').length
  if (skipped > 0) traits.push(`미인증 ${skipped}`)
  if (active.some((row) => row.action === 'certify' && row.memo?.trim())) traits.push('특이사항')
  if (active.some(isOvertime)) traits.push('시간초과')
  if (handoverCount(draft) > 0) traits.push('교대')
  if (draft.endAfterIndex !== null) traits.push('도중 종료')
  return traits.length === 0 ? '정상 완료' : traits.join(' · ')
}

/** 실제로 일어나는 교대 수 — 종료 지점과 그 뒤의 교대는 세지 않는다 */
const handoverCount = (draft: PlanDraft): number => {
  const fromStart = draft.startHandoverTo !== null && draft.endAfterIndex !== START_ROW ? 1 : 0
  const fromRows = draft.rows.filter(
    (row, index) =>
      row.handoverTo !== null && (draft.endAfterIndex === null || index < draft.endAfterIndex)
  ).length
  return fromStart + fromRows
}

/** 계획이 끝날 때까지 걸리는 대기 시간 합(초) — 입력 창에 미리 보인다 */
export const totalWaitSeconds = (draft: PlanDraft, handoverPauseSeconds: number): number =>
  draft.rows
    .filter((_, index) => isActiveRow(draft, index))
    .reduce((sum, row) => sum + row.waitSeconds, 0) +
  handoverCount(draft) * handoverPauseSeconds
