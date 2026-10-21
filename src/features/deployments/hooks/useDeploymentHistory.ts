import { useQuery } from '@tanstack/react-query'

import { fetchDeploymentHistory } from '../api/getDeploymentHistory'
import { deploymentKeys } from '../queryKeys'
import type { DeploymentHistoryParams } from '../types/deployment'

/** 전출·전입 이력 (`spec 039` T634). `params` 가 `null` 이면 요청하지 않는다 */
export const useDeploymentHistory = (params: DeploymentHistoryParams | null) =>
  useQuery({
    queryKey: deploymentKeys.history(params ?? ({ siteSeq: -1 } as DeploymentHistoryParams)),
    queryFn: () => fetchDeploymentHistory(params as DeploymentHistoryParams),
    enabled: params !== null,
  })
