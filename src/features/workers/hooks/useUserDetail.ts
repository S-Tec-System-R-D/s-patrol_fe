import { useQuery } from '@tanstack/react-query'

import { fetchUserDetail } from '../api/getUserDetail'
import { userKeys } from '../queryKeys'

/**
 * 근무자 상세 (`spec 038` T603).
 *
 * 🔴 **`userSeq` 가 `null` 이면 호출하지 않는다** — 라우트 파라미터가 숫자가 아닌 경우다.
 * ⚠️ 그때 쿼리는 **영원히 `isPending`** 이므로 호출부가 로딩보다 먼저 "주소 오류" 로 분기한다
 * (037 T557 · 026 승계).
 */
export const useUserDetail = (userSeq: number | null) =>
  useQuery({
    queryKey: userKeys.detail(userSeq ?? -1),
    queryFn: () => fetchUserDetail(userSeq as number),
    enabled: userSeq !== null,
  })
