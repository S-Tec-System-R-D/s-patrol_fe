import { useQuery } from '@tanstack/react-query'

import { fetchPointList } from '../api/getPointList'
import { pointKeys } from '../queryKeys'
import { toPointListParams, type PointListQuery } from '../lib/pointListParams'

/**
 * 순찰지점 목록 조회.
 *
 * 🔴 **`siteSeq`가 없으면 조회하지 않는다**(`enabled`). 없는 채로 요청이 나가면 서버가
 * 403이 아니라 **`HTTP 200` + 빈 목록**을 주므로(`api-spec.md:211` B-9) 장애가 아니라
 * "데이터 없는 정상 화면"으로 그려진다 — 가장 찾기 어려운 종류의 버그다.
 * `AuthGuard`(spec 021)가 이미 현장 영역에서 막지만, 여기서 한 번 더 끊는다.
 */

/** 조회하지 않는 상태를 쿼리 키에 드러내기 위한 값. `enabled: false`라 요청은 나가지 않는다 */
const NO_SITE = -1

export const usePointList = (siteSeq: number | null, query: PointListQuery) => {
  const params = toPointListParams(siteSeq ?? NO_SITE, query)

  return useQuery({
    queryKey: pointKeys.list(params),
    queryFn: () => fetchPointList(params),
    enabled: siteSeq !== null,
  })
}
