import { useQuery } from '@tanstack/react-query'

import { fetchTodaySummary } from '../api/getTodaySummary'
import { dashboardKeys } from '../queryKeys'

/**
 * 오늘 숫자 (`spec 068` T1129).
 *
 * 🔴 **`siteSeq` 가 `null` 이면 호출하지 않는다** — 서버가 사업장 권한을 검사하지 않아(B-9) 엉뚱한 값이면
 * 남의 사업장 숫자가 정상처럼 온다(`useNoticeList` 와 같은 판단).
 */
export const useTodaySummary = (siteSeq: number | null) =>
  useQuery({
    queryKey: dashboardKeys.summary(siteSeq ?? -1),
    queryFn: () => fetchTodaySummary(siteSeq as number),
    enabled: siteSeq !== null,
  })
