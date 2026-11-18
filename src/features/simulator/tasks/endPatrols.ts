import type { SimTask } from './types'
import { runEndPatrol } from './workerActions'
import { readyWorkers } from './workerOptions'

/**
 * 진행 중 순찰 전원 종료 (`spec 082` US5 — 정리).
 * 중단하거나 새로고침해서 서버에 "순찰 중"으로 남은 회차를 한꺼번에 닫는다.
 * 한 명만 닫을 때는 그 근무자 줄의 "순찰 종료" 버튼을 쓴다 — 여기는 고를 것이 없어 확인 창만 뜬다.
 */
export const endPatrolsTask: SimTask = {
  id: 'end-patrols',
  group: '정리',
  name: '진행 중 순찰 전원 종료',

  fields: () => [],

  validate: (_values, data) => (readyWorkers(data).length === 0 ? '로그인되는 근무자가 없습니다.' : null),

  summary: (_values, data) => `근무자 ${readyWorkers(data).length}명 확인`,

  run: async (ctx, _values, data) => {
    const workers = readyWorkers(data)
    ctx.setProgress(0, workers.length)
    for (const [index, worker] of workers.entries()) {
      await runEndPatrol(ctx, { loginId: worker.loginId, name: worker.userName })
      ctx.setProgress(index + 1, workers.length)
    }
  },
}
