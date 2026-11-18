import { describe, expect, it } from 'vitest'
import type { CertifyInput, PatrolApi } from '../../api/patrol'
import type { TaskContext } from '../../engine/runStore'
import type { ActivePatrol, ActivePatrolDetail } from '../../types'
import { START_ROW, type PatrolPlan, type PlanDraft, type PlanRow } from '../plan'
import { HANDOVER_PAUSE_SECONDS, runPatrol } from '../runPatrol'

const A = '600101'
const B = '600102'
const HISTORY = 500

const detail = (index: number): ActivePatrolDetail => ({
  detailSeq: 900 + index,
  coursePointSeq: 700 + index,
  pointSeq: 10 + index,
  pointName: `지점 ${index + 1}`,
  pointMemo: null,
  authMethod: index === 2 ? 10 : 9,
  courseMin: 1,
  orderNo: index + 1,
  detailStatus: index === 0 ? 1 : 0,
  checkUserSeq: null,
  checkUserName: null,
  overtimeYn: false,
  checkDt: null,
  memoList: [],
})

const patrolOf = (count: number, ended: boolean): ActivePatrol => ({
  historySeq: HISTORY,
  startDt: '2026-11-18T13:00:00',
  endDt: ended ? '2026-11-18T13:01:00' : null,
  pauseStartDt: null,
  pauseTime: 0,
  courseName: '시뮬 코스',
  courseMemo: null,
  totalMin: count,
  startUserSeq: 1,
  startUserName: '근무자1',
  switchYn: true,
  patrolStatus: ended ? 0 : 1,
  prevUserSeq: null,
  prevUserName: null,
  details: Array.from({ length: count }, (_, index) => ({
    ...detail(index),
    detailStatus: ended ? 4 : detail(index).detailStatus,
  })),
})

const row = (index: number, patch: Partial<PlanRow> = {}): PlanRow => ({
  pointSeq: 10 + index,
  pointName: `지점 ${index + 1}`,
  authMethod: index === 2 ? 10 : 9,
  courseMin: 1,
  canCertify: true,
  action: 'certify',
  waitSeconds: 10,
  memo: null,
  handoverTo: null,
  ...patch,
})

const planOf = (rows: PlanRow[], extra: Partial<Omit<PlanDraft, 'rows'>> = {}): PatrolPlan => ({
  workerLoginId: A,
  siteSeq: 34,
  courseSeq: 93,
  rows,
  startHandoverTo: null,
  endAfterIndex: null,
  ...extra,
})

/** 호출을 `누가 무엇을` 한 줄씩 적는 가짜 */
const fakes = (count: number) => {
  const calls: string[] = []
  const certified: CertifyInput[] = []
  const accepted: number[] = []
  let clock = 0

  const api: PatrolApi = {
    startPatrol: async (who, courseSeq, siteSeq) => {
      calls.push(`${who} start ${courseSeq}@${siteSeq}`)
      return HISTORY
    },
    getActivePatrol: async (who) => {
      calls.push(`${who} active`)
      return patrolOf(count, false)
    },
    getPatrolInfo: async (who) => {
      calls.push(`${who} info`)
      return patrolOf(count, true)
    },
    getPointDetail: async (_who, pointSeq) => ({
      pointSeq,
      name: `지점`,
      memo: null,
      authMethod: pointSeq === 12 ? 10 : 9,
      authMethodName: '',
      qrCode: pointSeq === 12 ? null : `QR-${pointSeq}`,
      nfcTagId: pointSeq === 12 ? `NFC-${pointSeq}` : null,
      gpsLat: 37.5,
      gpsLng: 127.1,
      useYn: true,
      lastPatrolDt: null,
      lastPatrolUserSeq: null,
      lastPatrolUserName: null,
      courseList: [],
    }),
    certify: async (who, input) => {
      calls.push(`${who} ${input.skip ? 'skip' : 'cert'} ${input.detailSeq}`)
      certified.push(input)
      return true
    },
    endPatrol: async (who) => {
      calls.push(`${who} end`)
      return true
    },
    requestHandOver: async (who) => {
      calls.push(`${who} request`)
      return true
    },
    cancelHandOver: async () => true,
    acceptHandOver: async (who, _historySeq, pauseSeconds) => {
      calls.push(`${who} accept`)
      accepted.push(pauseSeconds)
      return true
    },
  }

  const notes: (string | undefined)[] = []
  const ctx: TaskContext = {
    signal: new AbortController().signal,
    step: async (_title, fn, note) => {
      const result = await fn()
      notes.push(note?.(result))
      return result
    },
    // 기다리는 대신 시계만 돌린다
    wait: async (seconds) => {
      calls.push(`wait ${seconds}`)
      clock += seconds * 1000
    },
    setProgress: () => {},
  }

  return { api, ctx, calls, certified, accepted, notes, now: () => clock }
}

const names = { [A]: '근무자1', [B]: '근무자2' }

describe('runPatrol', () => {
  it('정상 완료 — 시작 → 지점 줄 읽기 → 순서대로 기다렸다 인증 → 결과 확인(종료 API 는 부르지 않는다)', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1), row(2)]), { names, now: f.now })

    expect(f.calls).toEqual([
      `${A} start 93@34`,
      `${A} active`,
      'wait 10',
      `${A} cert 900`,
      'wait 10',
      `${A} cert 901`,
      'wait 10',
      `${A} cert 902`,
      `${A} info`,
    ])
  })

  it('인증값은 지점 상세에서 꺼낸다 — QR 은 코드, NFC 는 태그 값. 메모가 없으면 싣지 않는다', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1, { memo: '  문 열림  ' }), row(2)]), { names, now: f.now })

    expect(f.certified[0]).toEqual({
      historySeq: HISTORY,
      detailSeq: 900,
      skip: false,
      authMethod: 9,
      authValue: 'QR-10',
      gpsLat: 37.5,
      gpsLng: 127.1,
    })
    expect(f.certified[1]).toMatchObject({ authValue: 'QR-11', memo: '문 열림' })
    expect(f.certified[2]).toMatchObject({ authMethod: 10, authValue: 'NFC-12' })
    expect('memo' in f.certified[2]).toBe(false)
  })

  it('미인증 — 그 지점은 인증값 없이 건너뛰기로 보낸다', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1, { action: 'skip' }), row(2)]), { names, now: f.now })

    expect(f.certified[1]).toEqual({ historySeq: HISTORY, detailSeq: 901, skip: true })
    expect(f.calls).toContain(`${A} skip 901`)
  })

  it('도중 종료 — 그 줄의 지점을 처리한 뒤 종료 API 를 부르고 뒤 지점은 처리하지 않는다', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1), row(2)], { endAfterIndex: 0 }), { names, now: f.now })

    expect(f.calls).toEqual([`${A} start 93@34`, `${A} active`, 'wait 10', `${A} cert 900`, `${A} end`, `${A} info`])
  })

  it('순찰 시작 줄에서 종료 — 인증 없이 바로 닫는다', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1), row(2)], { endAfterIndex: START_ROW }), {
      names,
      now: f.now,
    })

    expect(f.calls).toEqual([`${A} start 93@34`, `${A} active`, `${A} end`, `${A} info`])
    expect(f.certified).toEqual([])
  })

  it('순찰 시작 줄에서 교대 — 첫 지점부터 새 담당자가 인증한다', async () => {
    const f = fakes(2)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1)], { startHandoverTo: B }), { names, now: f.now })

    expect(f.calls).toEqual([
      `${A} start 93@34`,
      `${A} active`,
      `${A} request`,
      `wait ${HANDOVER_PAUSE_SECONDS}`,
      `${B} accept`,
      'wait 10',
      `${B} cert 900`,
      'wait 10',
      `${B} cert 901`,
      `${B} info`,
    ])
  })

  it('교대 — 그 줄의 지점을 인증한 **뒤** 담당자가 요청하고 다른 근무자가 수락한다(대시보드와 같은 자리)', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0, { handoverTo: B }), row(1), row(2)]), { names, now: f.now })

    expect(f.calls).toEqual([
      `${A} start 93@34`,
      `${A} active`,
      'wait 10',
      `${A} cert 900`,
      `${A} request`,
      `wait ${HANDOVER_PAUSE_SECONDS}`,
      `${B} accept`,
      'wait 10',
      `${B} cert 901`,
      'wait 10',
      `${B} cert 902`,
      `${B} info`,
    ])
  })

  it('교대 — 멈춘 시간은 실제로 기다린 시간을 재서 보낸다', async () => {
    const f = fakes(2)
    await runPatrol(f.ctx, f.api, planOf([row(0, { handoverTo: B }), row(1)]), { names, now: f.now })

    expect(f.accepted).toEqual([HANDOVER_PAUSE_SECONDS])
  })

  it('교대 뒤 도중 종료는 새 담당자가 한다', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0, { handoverTo: B }), row(1), row(2)], { endAfterIndex: 1 }), {
      names,
      now: f.now,
    })

    expect(f.calls.slice(-2)).toEqual([`${B} end`, `${B} info`])
  })

  it('이미 담당자인 사람에게는 교대하지 않는다', async () => {
    const f = fakes(2)
    await runPatrol(f.ctx, f.api, planOf([row(0, { handoverTo: A }), row(1)]), { names, now: f.now })

    expect(f.calls).not.toContain(`${A} request`)
  })

  it('마지막 지점의 교대 · 종료는 실행하지 않는다 — 인증하는 순간 순찰이 닫힌다', async () => {
    const f = fakes(2)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1, { handoverTo: B })], { endAfterIndex: 1 }), {
      names,
      now: f.now,
    })

    expect(f.calls).toEqual([`${A} start 93@34`, `${A} active`, 'wait 10', `${A} cert 900`, 'wait 10', `${A} cert 901`, `${A} info`])
  })

  it('회차의 지점 수가 계획과 다르면 인증하기 전에 멈춘다', async () => {
    const f = fakes(2)
    await expect(runPatrol(f.ctx, f.api, planOf([row(0), row(1), row(2)]), { names, now: f.now })).rejects.toThrow(
      '코스 편성이 바뀌었습니다'
    )
    expect(f.certified).toEqual([])
  })

  it('결과 확인에 인증 · 미완료 수를 적는다', async () => {
    const f = fakes(3)
    await runPatrol(f.ctx, f.api, planOf([row(0), row(1), row(2)]), { names, now: f.now })

    expect(f.notes.at(-1)).toBe('인증 3 · 미완료 0')
  })
})
