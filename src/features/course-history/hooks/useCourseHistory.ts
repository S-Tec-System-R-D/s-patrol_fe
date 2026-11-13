import { useQuery } from '@tanstack/react-query'

import { fetchCourseHistory } from '../api/getCourseHistory'
import { courseHistoryKeys } from '../queryKeys'
import type { HistoryRange } from '../lib/historyRange'

/**
 * 코스 순찰이력 (`spec 023` 코스 상세 B단). 미인증 조회는 `spec 074` 에서 걷었다(이상 이력 카드 삭제).
 *
 * 🔴 **이 요청이 전부다.** 평균 소요·인증률은 아래 응답의 행을 프론트가 더한다
 * (`lib/courseHistoryStats.ts`) — 서버에 집계 엔드포인트가 없다.
 *
 * 🔴 **`siteSeq` 가 `null` 이면 호출하지 않는다.** 상세 응답에 `siteSeq` 가 없어
 * `getSiteSeq()`(spec 021)가 유일한 출처이고(OQ-9), 없이 보내면 **권한 밖 사업장도
 * 200 + 빈 목록**이 와서(B-9) 장애가 "이력 없는 정상 화면" 으로 보인다.
 */

/** 🔴 한 번에 받는 상한. 넘으면 `partial` 로 표시해 "최근 N건 기준" 임을 화면이 밝힌다 */
export const HISTORY_PAGE_SIZE = 100

export const useCourseHistory = (
  siteSeq: number | null,
  courseSeq: number | null,
  range: HistoryRange
) =>
  useQuery({
    queryKey: courseHistoryKeys.history(siteSeq ?? -1, courseSeq ?? -1, range),
    queryFn: () =>
      fetchCourseHistory({
        siteSeq: siteSeq as number,
        courseSeq: courseSeq as number,
        fromDt: range.fromDt,
        toDt: range.toDt,
        pageNumber: 1,
        pageSize: HISTORY_PAGE_SIZE,
      }),
    enabled: siteSeq !== null && courseSeq !== null,
  })
