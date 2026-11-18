import { requestAssignmentReturn, setWorkStatus } from '../api/assignment'
import { patrolApi } from '../api/patrol'
import type { TaskContext } from '../engine/runStore'

/**
 * 근무자 줄에서 바로 실행하는 동작 (`spec 082` US4 · US5).
 *
 * 🔴 **입력 창이 없다** — 그 근무자의 지금 상태에서 할 수 있는 것만 줄에 버튼으로 보이므로
 * 고를 것이 없다(사용자 결정 2026-11-18: 드롭다운으로 고르면 배치 중이 아닌 사람에게 복귀 요청을
 * 보내는 식의 잘못된 대상이 섞인다).
 */
export interface ActionWorker {
  loginId: string
  name: string
}

/** 근무 시작(`true`) · 종료(`false`) — 여러 명이면 차례로 */
export const runSetWork = async (ctx: TaskContext, workers: ActionWorker[], workYn: boolean): Promise<void> => {
  const verb = workYn ? '근무 시작' : '근무 종료'
  ctx.setProgress(0, workers.length)
  for (const [index, worker] of workers.entries()) {
    await ctx.step(`${verb} · ${worker.name}`, () => setWorkStatus(worker.loginId, workYn))
    ctx.setProgress(index + 1, workers.length)
  }
}

/** 복귀 요청 — 배치 번호는 근무자 줄이 이미 알고 있다 */
export const runReturnRequest = (ctx: TaskContext, worker: ActionWorker, assignmentSeq: number): Promise<boolean> =>
  ctx.step(
    `복귀 요청 · ${worker.name}`,
    () => requestAssignmentReturn(worker.loginId, assignmentSeq),
    () => `배치 #${assignmentSeq} · 원 소속 사업장의 복귀 화면에서 승인 대기`
  )

/**
 * 진행 중인 순찰을 닫는다(남은 지점은 미완료가 된다).
 * 교대 요청 중이면 먼저 요청을 취소한다 — 그 상태로는 담당자가 바뀔 수 있어 종료가 엇갈린다.
 */
export const runEndPatrol = async (ctx: TaskContext, worker: ActionWorker): Promise<void> => {
  const patrol = await ctx.step(
    `확인 · ${worker.name}`,
    () => patrolApi.getActivePatrol(worker.loginId),
    (active) => (active ? `회차 #${active.historySeq} · ${active.courseName}` : '진행 중 순찰 없음')
  )
  if (!patrol) return
  // patrolStatus 2 = 교대 요청 중
  if (patrol.patrolStatus === 2) {
    await ctx.step(`교대 요청 취소 · ${worker.name}`, () =>
      patrolApi.cancelHandOver(worker.loginId, patrol.historySeq, 0)
    )
  }
  await ctx.step(`순찰 종료 · ${worker.name}`, () => patrolApi.endPatrol(worker.loginId, patrol.historySeq))
}
