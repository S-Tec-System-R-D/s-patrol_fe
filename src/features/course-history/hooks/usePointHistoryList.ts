import { useQuery } from '@tanstack/react-query'

import { fetchPointHistory } from '../api/getPointHistory'
import { pointHistoryKeys } from '../queryKeys'
import type { PointHistoryParams } from '../types'

/**
 * 지점 순찰이력 **목록** (`spec 037` T540).
 *
 * 🔴 **`usePointHistory`(`features/points/hooks`)와 다른 훅이다.** 같은 엔드포인트를 쓰지만
 * 하는 일이 다르다 — 036 이 코스에서 목록/집계 훅을 나눈 것과 같은 이유다:
 * - `usePointHistory` — 지점 상세(027)·지점 인증 상세(037 US3)의 **집계·최근 기록**용.
 *   `pointSeq` 가 필수고 기간이 고정이며 `pageSize: 100` 한 장으로 끝낸다.
 * - **이 훅** — 이력 화면의 **페이지네이션 목록**. `pointSeq` 없이 사업장 전체를 보고
 *   필터 4종으로 좁히며 페이지를 넘긴다.
 *
 * 하나로 합치면 "집계인가 목록인가" 가 호출부에서 사라지고, 집계 쪽이 페이지를 넘기거나
 * 목록 쪽이 100건을 한 번에 받는 사고가 난다(A6 — 한 함수 한 가지 일).
 *
 * 🔴 **`siteSeq` 가 `null` 이면 호출하지 않는다.** 서버가 `siteSeq` 권한을 검사하지
 * 않으므로(B-9) 권한 밖 값도 **200 + 실제 데이터**가 온다 — 없이 보내면 400 이 아니라
 * 엉뚱한 사업장이 올 수 있고, 그러면 **장애가 "정상 화면" 으로 보인다.**
 */

export const usePointHistoryList = (params: PointHistoryParams | null) =>
  useQuery({
    queryKey: pointHistoryKeys.list(params ?? ({ siteSeq: -1 } as PointHistoryParams)),
    queryFn: () => fetchPointHistory(params as PointHistoryParams),
    enabled: params !== null,
  })
