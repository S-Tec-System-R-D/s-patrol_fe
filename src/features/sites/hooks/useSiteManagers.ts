import { useQuery } from '@tanstack/react-query'

import { getSiteManagerList } from '../api/getSiteManagerList'
import { siteKeys } from '../queryKeys'

/** 사업장 담당 관리자 (`spec 057` T1020) — `siteSeq` 가 `null` 이면 호출하지 않는다(주소 오류) */
export const useSiteManagers = (siteSeq: number | null) =>
  useQuery({
    queryKey: siteKeys.managers(siteSeq ?? -1),
    queryFn: () => getSiteManagerList(siteSeq as number),
    enabled: siteSeq !== null,
  })
