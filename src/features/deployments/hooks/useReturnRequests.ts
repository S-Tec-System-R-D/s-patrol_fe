import { useQuery } from '@tanstack/react-query'

import { fetchAssignmentReturnList } from '../api/getAssignmentReturnList'
import { deploymentKeys } from '../queryKeys'

/**
 * 대기 중 복귀 요청 (`spec 042` T705) — 배열 전체. `siteSeq` 가 `null` 이면 요청하지 않는다.
 * 탭 뱃지는 요약의 `pendingReturnCount` 라(042 후속) 복귀 탭에서만 부른다.
 */
export const useReturnRequests = (siteSeq: number | null) =>
  useQuery({
    queryKey: deploymentKeys.returns(siteSeq ?? -1),
    queryFn: () => fetchAssignmentReturnList(siteSeq as number),
    enabled: siteSeq !== null,
  })
