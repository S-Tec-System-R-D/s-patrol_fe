import { useQuery } from '@tanstack/react-query'

import { fetchDeploymentRequestList } from '../api/getDeploymentRequestList'
import { deploymentKeys } from '../queryKeys'
import type { DeploymentRequestListParams } from '../types/deployment'

/** 대기 중 배치 요청 목록 (`spec 039` T634). `params` 가 `null` 이면 요청하지 않는다 */
export const useDeploymentRequests = (params: DeploymentRequestListParams | null) =>
  useQuery({
    queryKey: deploymentKeys.requests(params ?? ({ siteSeq: -1 } as DeploymentRequestListParams)),
    queryFn: () => fetchDeploymentRequestList(params as DeploymentRequestListParams),
    enabled: params !== null,
  })
