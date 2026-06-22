import type { PointAuthenticationMethod } from '@/features/points/types'

export interface PatrolPointHistory {
  name: string
  patrolDt: Date // 순찰일시
  authenticationMethod: PointAuthenticationMethod
  user: string
  result: PatrolPointResultState
}

export type PatrolPointResultState =
  | 'PENDING'
  | 'RUNNING'
  | 'SKIP'
  | 'NORMAL'
  | 'RECORDED'
  | 'TIMEOUT'
