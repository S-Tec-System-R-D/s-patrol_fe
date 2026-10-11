import { useQuery } from '@tanstack/react-query'

import { fetchCourseDetail } from '../api/detailCourse'
import { courseKeys } from '../queryKeys'

/**
 * 순찰코스 상세 조회.
 *
 * 🔴 **목록 행을 그대로 쓰지 않고 `courseSeq` 로 따로 조회한다**(022·027 승계). 목록
 * (`CourseRow`)과 상세(`CourseDetail`)의 필드 집합이 다르다 — 상세에만 `memo`·`points`
 * 가 있고, **목록에만** `courseStatusCode`·`pointCount` 가 있다. 즉 둘 중 하나로는
 * 화면이 채워지지 않는다.
 *
 * ⚠️ 상세 응답에 **`siteSeq` 가 없다**(OQ-9) — 수정 요청을 만들 때 `getSiteSeq()` 로
 * 보충해야 한다.
 */

const NO_COURSE = -1

export const useCourseDetail = (courseSeq: number | null) =>
  useQuery({
    queryKey: courseKeys.detail(courseSeq ?? NO_COURSE),
    queryFn: () => fetchCourseDetail(courseSeq as number),
    enabled: courseSeq !== null,
  })
