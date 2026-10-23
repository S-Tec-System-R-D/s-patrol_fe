import { useQuery } from '@tanstack/react-query'

import { getSiteDetail } from '../api/getSiteDetail'
import { siteKeys } from '../queryKeys'

/**
 * 사업장 상세 (`spec 044` T783).
 *
 * 🔴 **`siteSeq` 가 `null` 이면 호출하지 않는다** — 라우트 파라미터가 숫자가 아닌 경우다.
 * ⚠️ 그때 쿼리는 영원히 `isPending` 이므로 호출부가 로딩보다 먼저 "찾을 수 없음" 으로 분기한다(038 과 같다).
 */
export const useSiteDetail = (siteSeq: number | null) =>
  useQuery({
    queryKey: siteKeys.detail(siteSeq ?? -1),
    queryFn: () => getSiteDetail(siteSeq as number),
    enabled: siteSeq !== null,
  })
