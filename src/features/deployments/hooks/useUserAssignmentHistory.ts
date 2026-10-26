import { useQuery } from '@tanstack/react-query'

import { fetchUserAssignmentHistory } from '../api/getUserAssignmentHistory'
import { deploymentKeys } from '../queryKeys'
import type { UserAssignmentHistoryParams } from '../types/deployment'

/** 근무자별 배치 이력 (`spec 042` T722) — 근무자 상세 섹션 */
export const useUserAssignmentHistory = (params: UserAssignmentHistoryParams) =>
  useQuery({
    queryKey: deploymentKeys.userHistory(params),
    queryFn: () => fetchUserAssignmentHistory(params),
    // 🔴 [더보기]가 pageSize 를 키우는 동안 이미 보인 행을 유지한다(`spec 049`) — 다른 사람으로 바뀌면 버린다
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === params.userSeq ? previous : undefined,
  })
