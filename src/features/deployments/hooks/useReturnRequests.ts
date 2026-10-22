import { useQuery } from '@tanstack/react-query'

import { fetchAssignmentReturnList } from '../api/getAssignmentReturnList'
import { deploymentKeys } from '../queryKeys'

/**
 * 대기 중 복귀 요청 (`spec 042` T705) — 배열 전체. `siteSeq` 가 `null` 이면 요청하지 않는다.
 * 🔴 탭 뱃지가 이 목록 길이라(요약에 복귀 건수가 없다) 복귀 탭이 아니어도 부른다.
 */
export const useReturnRequests = (siteSeq: number | null) =>
  useQuery({
    queryKey: deploymentKeys.returns(siteSeq ?? -1),
    queryFn: () => fetchAssignmentReturnList(siteSeq as number),
    enabled: siteSeq !== null,
  })
