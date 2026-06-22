import type { PatrolPointHistory } from '@/features/patrol-points/types/PatrolPoint'
import type { PatrolZoneResult } from './PatrolZoneResult'

export interface PatrolZone {
  name: string
  startedDt: Date
  endedDt: Date
  totalTime: string
  result: PatrolZoneResult
  points: PatrolPointHistory[]
}
