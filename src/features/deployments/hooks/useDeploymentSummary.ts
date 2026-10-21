import { useQuery } from '@tanstack/react-query'

import { fetchDeploymentSummary } from '../api/getDeploymentSummary'
import { deploymentKeys } from '../queryKeys'

/**
 * 배치 현황 요약 (`spec 039` T634) — KPI 3종 + 사이드바 대기 뱃지가 **같은 쿼리**를 쓴다.
 *
 * 🔴 `siteSeq` 가 `null` 이면 요청하지 않는다(사업장 미선택).
 */
export const useDeploymentSummary = (siteSeq: number | null) =>
  useQuery({
    queryKey: deploymentKeys.summary(siteSeq ?? -1),
    queryFn: () => fetchDeploymentSummary(siteSeq as number),
    enabled: siteSeq !== null,
  })
