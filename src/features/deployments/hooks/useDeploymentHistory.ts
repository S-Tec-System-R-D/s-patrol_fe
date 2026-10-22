import { useQuery } from '@tanstack/react-query'

import type { PagedData } from '@/types/api'
import { fetchAssignmentInHistory, fetchAssignmentOutHistory } from '../api/getAssignmentHistory'
import { deploymentKeys } from '../queryKeys'
import type {
  AssignmentHistoryParams,
  AssignmentInHistoryRow,
  AssignmentOutHistoryRow,
} from '../types/deployment'

export type AssignmentHistoryRow = AssignmentInHistoryRow | AssignmentOutHistoryRow

/**
 * 전입·전출 이력 (`spec 042` T705) — 탭으로 엔드포인트가 갈린다. `params` 가 `null` 이면 요청하지 않는다.
 */
export const useDeploymentHistory = (tab: 'in' | 'out', params: AssignmentHistoryParams | null) =>
  useQuery<PagedData<AssignmentHistoryRow>>({
    queryKey: deploymentKeys.history(tab, params ?? ({ siteSeq: -1 } as AssignmentHistoryParams)),
    queryFn: () =>
      tab === 'in'
        ? fetchAssignmentInHistory(params as AssignmentHistoryParams)
        : fetchAssignmentOutHistory(params as AssignmentHistoryParams),
    enabled: params !== null,
  })
