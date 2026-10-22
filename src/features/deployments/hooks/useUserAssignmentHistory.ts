import { useQuery } from '@tanstack/react-query'

import { fetchUserAssignmentHistory } from '../api/getUserAssignmentHistory'
import { deploymentKeys } from '../queryKeys'
import type { UserAssignmentHistoryParams } from '../types/deployment'

/** 근무자별 배치 이력 (`spec 042` T722) — 근무자 상세 섹션 */
export const useUserAssignmentHistory = (params: UserAssignmentHistoryParams) =>
  useQuery({
    queryKey: deploymentKeys.userHistory(params),
    queryFn: () => fetchUserAssignmentHistory(params),
  })
