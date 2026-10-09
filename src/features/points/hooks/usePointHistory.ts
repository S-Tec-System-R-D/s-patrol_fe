import { useQuery } from '@tanstack/react-query'

import { fetchPointHistory } from '../api/pointHistory'
import { pointKeys } from '../queryKeys'
import type { PointHistoryParams } from '../types'

/**
 * 지점 순찰이력 조회 (`spec 027` Phase 3).
 *
 * 🔴 **`siteSeq`·`pointSeq` 가 없으면 조회하지 않는다.** 목록과 같은 이유다 — 서버가
 * 권한 밖/없는 값에 403 이 아니라 정상 응답을 주므로(B-9) 요청이 나가면 "데이터 없는
 * 정상 화면" 이 된다.
 *
 * 🔴 **`pageSize` 를 크게 잡는다.** 전용 집계 API 가 없어 30일치를 받아 클라이언트에서
 * 센다(`lib/patrolSummary.ts`). 한 페이지에 안 들어오면 총계가 **조용히 적게** 나온다 —
 * 지점 하나의 30일 인증이 200건을 넘을 일은 없다고 보고 그 값을 쓴다.
 */

const NO_VALUE = -1

/** 30일 집계를 한 페이지로 받기 위한 값. 넘치면 총계가 틀어지므로 넉넉히 잡는다 */
export const HISTORY_PAGE_SIZE = 200

export const usePointHistory = (
  siteSeq: number | null,
  pointSeq: number | null,
  fromDt: string,
  toDt: string
) => {
  const params: PointHistoryParams = {
    siteSeq: siteSeq ?? NO_VALUE,
    pointSeq: pointSeq ?? NO_VALUE,
    fromDt,
    toDt,
    pageNumber: 1,
    pageSize: HISTORY_PAGE_SIZE,
  }

  return useQuery({
    queryKey: pointKeys.history(params),
    queryFn: () => fetchPointHistory(params),
    enabled: siteSeq !== null && pointSeq !== null,
  })
}
