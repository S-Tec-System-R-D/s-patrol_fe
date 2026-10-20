import { useQuery } from '@tanstack/react-query'

import { fetchPointHistory } from '@/features/course-history/api/getPointHistory'
import type { PointHistoryParams } from '@/features/course-history/types'
import { pointKeys } from '../queryKeys'

/**
 * 지점 순찰이력 조회 (`spec 027` Phase 3).
 *
 * 🔴 **`siteSeq`·`pointSeq` 가 없으면 조회하지 않는다.** 목록과 같은 이유다 — 서버가
 * 권한 밖/없는 값에 403 이 아니라 정상 응답을 주므로(B-9) 요청이 나가면 "데이터 없는
 * 정상 화면" 이 된다.
 *
 * 🔴🔴 **`pageSize` 는 100 이 상한이다 — 200 을 보내고 있었다**(실측 2026-10-14).
 * 서버는 101 이상에 **400 `"페이지 사이즈는 1~100 사이여야 합니다."`** 를 준다. 즉 이
 * 화면의 순찰 기록 조회가 **실서버에서 통째로 실패**하고 있었고, 화면에는 "순찰 기록이
 * 없습니다" 가 떴다 — **장애가 빈 상태로 읽히는**, 이 프로젝트가 계속 경계해 온 모양이다.
 * **MSW 가 200 을 받아줘서 dev 에서는 멀쩡해 보였다**(mock 이 서버보다 관대하면 못 잡는다 —
 * 그래서 핸들러에도 상한 검증을 넣었다).
 * ⚠️ 옛 주석은 "200 건을 넘을 일은 없다" 였는데, **상한이 100 인 것을 모르고 쓴 값**이었다.
 *
 * 🔴 **그래서 한 페이지로 다 못 받을 수 있다.** 14일치 지점 이력이 100 건을 넘으면 총계가
 * **조용히 적게** 나온다 — `summarizePatrolHistory` 가 `partial` 로 알려 준다.
 */

const NO_VALUE = -1

/**
 * 🔴 **서버 상한이 100 이다**(실측 2026-10-14). 더 받고 싶어도 못 받는다 —
 * 기간이 길어지면 **서버 집계를 요청**하는 것이 맞다.
 */
export const HISTORY_PAGE_SIZE = 100

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
