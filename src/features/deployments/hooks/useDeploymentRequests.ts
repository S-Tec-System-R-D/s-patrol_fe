import { useQuery } from '@tanstack/react-query'

import { fetchAssignmentList } from '../api/getAssignmentList'
import { deploymentKeys } from '../queryKeys'

/** 대기 중 배치 요청 (`spec 042` T705) — 배열 전체. `siteSeq` 가 `null` 이면 요청하지 않는다 */
export const useDeploymentRequests = (siteSeq: number | null) =>
  useQuery({
    queryKey: deploymentKeys.requests(siteSeq ?? -1),
    queryFn: () => fetchAssignmentList(siteSeq as number),
    enabled: siteSeq !== null,
  })
