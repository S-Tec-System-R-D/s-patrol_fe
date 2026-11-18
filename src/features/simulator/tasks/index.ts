import { addCourseTask } from './addCourse'
import { addPointsTask } from './addPoints'
import { addWorkersTask } from './addWorkers'
import { endPatrolsTask } from './endPatrols'
import type { SimTask, TaskGroup } from './types'

/**
 * 작업 패널에 놓는 작업 — 새 작업은 파일을 만들고 여기에 넣는다 (`spec 082`).
 *
 * 여기 없는 것:
 * - 순찰 실행 — 지점별 표가 필요해 전용 입력 창(`PatrolRunDialog`)을 쓴다
 * - 근무 시작/종료 · 배치 요청 · 복귀 요청 · 한 명의 순찰 종료 — **근무자 줄**에서 한다(`workerActions.ts`).
 *   그 근무자의 상태에서 할 수 있는 것만 보이게 하기 위해서다
 */
export const SIM_TASKS: SimTask[] = [addPointsTask, addCourseTask, addWorkersTask, endPatrolsTask]

/** 작업 패널의 묶음 순서 */
export const TASK_GROUPS: TaskGroup[] = ['구축', '순찰', '정리']
