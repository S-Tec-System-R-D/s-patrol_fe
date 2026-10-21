import { useQuery } from '@tanstack/react-query'

import { fetchReturnRequestList } from '../api/getReturnRequestList'
import { deploymentKeys } from '../queryKeys'
import type { DeploymentRequestListParams } from '../types/deployment'

/** 대기 중 복귀 요청 목록 (`spec 039` T659). `params` 가 `null` 이면 요청하지 않는다 */
export const useReturnRequests = (params: DeploymentRequestListParams | null) =>
  useQuery({
    queryKey: deploymentKeys.returns(params ?? ({ siteSeq: -1 } as DeploymentRequestListParams)),
    queryFn: () => fetchReturnRequestList(params as DeploymentRequestListParams),
    enabled: params !== null,
  })
