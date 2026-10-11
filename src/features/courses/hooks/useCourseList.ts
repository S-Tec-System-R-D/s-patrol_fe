import { useQuery } from '@tanstack/react-query'

import { fetchCourseList } from '../api/getCourseList'
import { courseKeys } from '../queryKeys'
import { toCourseListParams, type CourseListQuery } from '../lib/courseListParams'

/**
 * 순찰코스 목록 조회.
 *
 * 🔴 **`siteSeq` 가 없으면 조회하지 않는다**(`enabled`). 없는 채로 요청이 나가면 서버가
 * 403 이 아니라 **`HTTP 200` + 빈 목록**을 주므로(B-9) 장애가 아니라 "데이터 없는 정상
 * 화면" 으로 그려진다 — 가장 찾기 어려운 종류의 버그다. `AuthGuard`(spec 021)가 이미
 * 현장 영역에서 막지만, 여기서 한 번 더 끊는다(022·027 선례).
 */

/** 조회하지 않는 상태를 쿼리 키에 드러내기 위한 값. `enabled: false` 라 요청은 나가지 않는다 */
const NO_SITE = -1

export const useCourseList = (
  siteSeq: number | null,
  query: CourseListQuery,
  /** 행 수. URL 이 아니라 화면 로컬 상태라 인자로 받는다(027 선례) */
  pageSize?: number
) => {
  const params = toCourseListParams(siteSeq ?? NO_SITE, query, pageSize)

  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => fetchCourseList(params),
    enabled: siteSeq !== null,
  })
}
