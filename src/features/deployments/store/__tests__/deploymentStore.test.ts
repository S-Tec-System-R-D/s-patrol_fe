import { beforeEach, describe, expect, it } from 'vitest'
import { initialHistoryItems, initialPendingRequests } from '../../mocks/deploymentData'
import { useDeploymentStore } from '../deploymentStore'

const resetStore = () =>
  useDeploymentStore.setState({
    pendingRequests: initialPendingRequests,
    historyItems: initialHistoryItems,
  })

describe('useDeploymentStore', () => {
  beforeEach(resetStore)

  it('초기 상태가 mock 시드와 일치', () => {
    const state = useDeploymentStore.getState()
    expect(state.pendingRequests).toHaveLength(2)
    expect(state.historyItems).toHaveLength(3)
  })

  it('approve 호출 시 큐에서 제거되고 이력에 1건 추가', () => {
    const target = initialPendingRequests[0]
    useDeploymentStore.getState().approve(target.id)

    const state = useDeploymentStore.getState()
    expect(state.pendingRequests.find((r) => r.id === target.id)).toBeUndefined()
    expect(state.historyItems).toHaveLength(4)
    expect(state.historyItems[0]).toMatchObject({
      workerName: target.workerName,
      fromLocationName: target.fromLocationName,
      toLocationName: target.toLocationName,
      reason: target.reason,
    })
  })

  it('reject 호출 시 큐에서만 제거되고 이력은 불변', () => {
    const target = initialPendingRequests[0]
    useDeploymentStore.getState().reject(target.id, '사유 예시')

    const state = useDeploymentStore.getState()
    expect(state.pendingRequests.find((r) => r.id === target.id)).toBeUndefined()
    expect(state.historyItems).toHaveLength(3)
  })
})
