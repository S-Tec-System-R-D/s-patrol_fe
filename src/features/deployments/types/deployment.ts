import type { DeploymentDirection, DeploymentStatus } from '@/types/enum'

// 배치 요청 목록(대기 큐) 행 — data-model.md §3-1 `DeploymentRequestSummary` 기준.
// `reason`은 목업(배치관리-신규.png) 근거로 추가된 필드(spec.md §3 참조, data-model.md 동기화 예정).
export interface DeploymentRequestSummary {
  id: string
  direction: DeploymentDirection
  workerName: string
  fromLocationName: string
  toLocationName: string
  reason: string
  status: DeploymentStatus
  requestedAt: string
  processedAt?: string
}

// 배치 이력(승인된 배치만) — 화면 표시 필드만 보유(CLAUDE.md B4).
export interface DeploymentHistoryItem {
  id: string
  workerName: string
  fromLocationName: string
  toLocationName: string
  reason: string
  startedAt: string
  endedAt?: string
}
