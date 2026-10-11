import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { CourseListParams, CourseRow } from '../types'

/**
 * 순찰코스 목록 조회.
 *
 * `GET /api/v1/Course/W/sign/GetCourseList`
 *
 * 🔴 **`siteSeq` 가 required 다.** 권한 밖 사업장을 넣으면 403 이 아니라 **`HTTP 200` +
 * 빈 목록**이 온다(B-9) — 장애가 "데이터 없는 정상 화면" 으로 보인다. 값은
 * `getSiteSeq()`(spec 021)가 준 것만 쓰고 `null` 이면 호출하지 않는다(훅의 `enabled`).
 *
 * `params` 의 `undefined` 는 axios 가 쿼리스트링에서 뺀다 — 필터 미적용은 `undefined`
 * 로 표현하고 "전체" 센티넬을 서버로 보내지 않는다.
 *
 * ⚠️ **서버 필터 4종(`searchKey`·`useYn`·`switchYn`·`courseStatus`)이 실제로 걸리는지는
 * 미실측이다.** 지점은 Phase 8 R2 에서 전부 걸리는 것을 확인했지만 코스는 아직이다
 * (`spec 023` T355). 걸리지 않으면 **클라이언트 필터를 만들지 말고 백엔드에 요청**한다.
 */

const GET_COURSE_LIST_PATH = '/api/v1/Course/W/sign/GetCourseList'

export const fetchCourseList = async (
  params: CourseListParams
): Promise<PagedData<CourseRow>> => {
  const res = await api.get<PagedData<CourseRow>>(GET_COURSE_LIST_PATH, { params })
  return res.data
}
