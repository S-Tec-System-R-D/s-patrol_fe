import type { PatrolApi } from '../api/patrol'
import type { TaskContext } from '../engine/runStore'
import type { ActivePatrol } from '../types'
import { START_ROW, type PatrolPlan } from './plan'

/**
 * 순찰 엔진 (`spec 082` US3) — 계획을 받아 근무자의 순찰을 API로 돌린다.
 * 규칙의 근거는 `docs/app-api-spec.md` §3-1 ~ §3-3(실측 2026-11-18).
 *
 * - 인증은 **순서대로만** 된다 — 계획의 줄 순서 = 코스의 지점 순서
 * - **마지막 지점을 처리하면 서버가 순찰을 닫는다** — 종료 API 는 도중 종료에만 부른다
 * - 교대는 **지금 담당자가 요청 → 다른 근무자가 수락**. 인증 · 종료는 그때의 담당자만 할 수 있다
 * - 🔴 교대 · 도중 종료는 **그 줄의 지점을 처리한 뒤**에 일어난다(웹 대시보드의 교대 표시와 같은 자리).
 *   "순찰 시작" 줄의 것은 첫 지점보다 앞에서 일어난다
 * - 🔴 멈춘 시간은 서버가 재지 않는다 — **실제로 기다린 시간을 재서** 수락할 때 보낸다
 */

/** 교대 요청과 수락 사이에 기다리는 시간(초) — 웹의 "교대중" 표시를 볼 틈 */
export const HANDOVER_PAUSE_SECONDS = 5

const METHOD_LABEL: Record<number, string> = { 9: 'QR', 10: 'NFC' }

/** 종료된 회차의 결과 한 줄 — 지점 줄 상태 3 미완료 · 4 완료 */
const summarize = (patrol: ActivePatrol): string => {
  const done = patrol.details.filter((detail) => detail.detailStatus === 4).length
  const missed = patrol.details.filter((detail) => detail.detailStatus === 3).length
  const overtime = patrol.details.filter((detail) => detail.overtimeYn).length
  return [`인증 ${done}`, `미완료 ${missed}`, ...(overtime > 0 ? [`시간초과 ${overtime}`] : [])].join(' · ')
}

export interface RunPatrolOptions {
  /** 로그에 쓸 이름 — 아이디 → 이름 */
  names: Record<string, string>
  /** 테스트가 시계를 바꿔 넣는다 */
  now?: () => number
}

export const runPatrol = async (
  ctx: TaskContext,
  api: PatrolApi,
  plan: PatrolPlan,
  { names, now = Date.now }: RunPatrolOptions
): Promise<void> => {
  const nameOf = (loginId: string) => names[loginId] ?? loginId
  const total = plan.rows.length
  let current = plan.workerLoginId

  const historySeq = await ctx.step(
    `순찰 시작 · ${nameOf(current)}`,
    () => api.startPatrol(current, plan.courseSeq, plan.siteSeq),
    (seq) => `회차 #${seq}`
  )

  const patrol = await ctx.step(
    '지점 줄 읽기',
    async () => {
      const active = await api.getActivePatrol(current)
      if (!active) throw new Error('진행 중인 순찰이 읽히지 않습니다')
      if (active.details.length !== total) {
        throw new Error(`코스 편성이 바뀌었습니다(계획 ${total}개 · 회차 ${active.details.length}개)`)
      }
      return active
    },
    (active) => `지점 ${active.details.length}개`
  )
  const details = [...patrol.details].sort((a, b) => a.orderNo - b.orderNo)

  ctx.setProgress(0, total)

  /** 지금 담당자가 요청하고 `to` 가 수락한다. 이미 담당자면 아무것도 하지 않는다 */
  const handOver = async (to: string | null) => {
    if (to === null || to === current) return
    const from = current
    await ctx.step(`교대 요청 · ${nameOf(from)}`, () => api.requestHandOver(from, historySeq))
    const pausedAt = now()
    await ctx.wait(HANDOVER_PAUSE_SECONDS, `교대 대기 ${HANDOVER_PAUSE_SECONDS}초`)
    await ctx.step(
      `교대 수락 · ${nameOf(to)}`,
      () => api.acceptHandOver(to, historySeq, Math.round((now() - pausedAt) / 1000)),
      () => `${nameOf(from)} → ${nameOf(to)}`
    )
    current = to
  }

  const endEarly = () => ctx.step(`도중 종료 · ${nameOf(current)}`, () => api.endPatrol(current, historySeq))

  // "순찰 시작" 줄 — 종료가 먼저다(인증 0개로 닫는다)
  const endedAtStart = plan.endAfterIndex === START_ROW
  if (endedAtStart) await endEarly()
  else await handOver(plan.startHandoverTo)

  for (const [index, row] of (endedAtStart ? [] : plan.rows).entries()) {
    const detail = details[index]
    const isLast = index === total - 1

    if (row.waitSeconds > 0) {
      await ctx.wait(row.waitSeconds, `대기 ${row.waitSeconds}초 · ${row.pointName}`)
    }

    if (row.action === 'skip') {
      await ctx.step(`건너뛰기 · ${row.pointName}`, () =>
        api.certify(current, { historySeq, detailSeq: detail.detailSeq, skip: true })
      )
    } else {
      const memo = row.memo?.trim() ?? ''
      await ctx.step(
        `인증 · ${row.pointName} (${METHOD_LABEL[row.authMethod] ?? row.authMethod})`,
        async () => {
          // 인증값은 지점 상세에 있다 — QR 은 코드 전체, NFC 는 태그 값
          const point = await api.getPointDetail(current, row.pointSeq)
          const authValue = row.authMethod === 10 ? point.nfcTagId : point.qrCode
          if (!authValue) throw new Error('이 지점에는 인증값이 없습니다')
          return api.certify(current, {
            historySeq,
            detailSeq: detail.detailSeq,
            skip: false,
            authMethod: row.authMethod,
            authValue,
            gpsLat: point.gpsLat,
            gpsLng: point.gpsLng,
            ...(memo ? { memo } : {}),
          })
        },
        () => (memo ? `메모: ${memo}` : nameOf(current))
      )
    }

    ctx.setProgress(index + 1, total)

    // 그 줄의 지점을 처리한 뒤에 일어나는 일 — 마지막 지점은 처리하는 순간 순찰이 닫혀 둘 다 없다
    if (isLast) break
    if (plan.endAfterIndex === index) {
      await endEarly()
      break
    }
    await handOver(row.handoverTo)
  }

  await ctx.step(
    '결과 확인',
    async () => {
      const result = await api.getPatrolInfo(current, historySeq)
      if (!result) throw new Error('회차가 읽히지 않습니다')
      if (result.endDt === null) throw new Error('순찰이 아직 닫히지 않았습니다')
      return result
    },
    summarize
  )
}
