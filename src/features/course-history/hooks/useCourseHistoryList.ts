import { useQuery } from '@tanstack/react-query'

import { fetchCourseHistory } from '../api/getCourseHistory'
import { courseHistoryKeys } from '../queryKeys'
import type { CourseHistoryParams } from '../types'

/**
 * 코스 순찰이력 **목록** (`spec 036` T494).
 *
 * 🔴 **`useCourseHistory`(같은 폴더)와 다른 훅이다.** 둘이 같은 엔드포인트를 쓰지만
 * 하는 일이 다르다:
 * - `useCourseHistory` — 코스 상세(`spec 023` B단)의 **30일 집계**용. 기간이 고정이고
 *   `courseSeq` 가 필수이며 `pageSize: 100` 한 장으로 끝낸다(집계가 목적이라 행을 다 받는다).
 * - **이 훅** — 이력 화면의 **페이지네이션 목록**. 기간·코스·결과·순찰자가 전부 선택이고
 *   페이지를 넘긴다.
 *
 * 하나로 합치면 "집계인가 목록인가" 가 호출부에서 사라지고, 집계 쪽이 페이지를 넘기거나
 * 목록 쪽이 100건을 한 번에 받는 사고가 난다(A6 — 한 함수 한 가지 일).
 *
 * 🔴 **`siteSeq` 가 `null` 이면 호출하지 않는다.** 서버가 `siteSeq` 권한을 검사하지
 * 않으므로(B-9) 권한 밖 값도 **200 + 실제 데이터**가 온다. 없이 보내면 400 이 아니라
 * 엉뚱한 사업장이 올 수 있고, 그러면 **장애가 "정상 화면" 으로 보인다.** `getSiteSeq()`
 * (`spec 021`)가 유일한 출처다.
 */

export const useCourseHistoryList = (params: CourseHistoryParams | null) =>
  useQuery({
    queryKey: courseHistoryKeys.list(params ?? ({ siteSeq: -1 } as CourseHistoryParams)),
    queryFn: () => fetchCourseHistory(params as CourseHistoryParams),
    enabled: params !== null,
  })
