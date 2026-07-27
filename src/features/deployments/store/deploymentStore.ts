import { create } from 'zustand'
import { initialHistoryItems, initialPendingRequests } from '../mocks/deploymentData'
import type { DeploymentHistoryItem, DeploymentRequestSummary } from '../types/deployment'

interface DeploymentState {
  pendingRequests: DeploymentRequestSummary[]
  historyItems: DeploymentHistoryItem[]
  approve: (id: string) => void
  reject: (id: string, reason: string) => void
}

/**
 * 배치 요청 큐 + 이력을 보유하는 mock 전용 store(실 API는 Phase 3 이후).
 * `RailSidebar`가 `.getState()`로 대기건수 뱃지를 읽고(sidebar.config.ts),
 * store 변경 시 재렌더되도록 `useDeploymentStore()` 훅도 구독한다(RailSidebar.tsx).
 */
export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  pendingRequests: initialPendingRequests,
  historyItems: initialHistoryItems,

  approve: (id) => {
    const target = get().pendingRequests.find((r) => r.id === id)
    if (!target) return

    const newHistoryItem: DeploymentHistoryItem = {
      id: `dep-hist-${id}`,
      workerName: target.workerName,
      fromLocationName: target.fromLocationName,
      toLocationName: target.toLocationName,
      reason: target.reason,
      startedAt: target.requestedAt,
    }

    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== id),
      historyItems: [newHistoryItem, ...state.historyItems],
    }))
  },

  reject: (id) => {
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.id !== id),
    }))
  },
}))
