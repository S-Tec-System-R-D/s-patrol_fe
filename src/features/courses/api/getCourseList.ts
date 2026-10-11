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
 * ✅ **서버 필터 4종을 실측했다**(2026-10-11, T355): `useYn`·`switchYn`·`searchKey`(부분
 * 일치)·`courseStatus` 가 **모두 걸리고**, 두 개를 함께 주면 **AND** 로 좁혀진다. 그래서
 * 클라이언트 필터 함수가 **0건**이다. ⚠️ `courseStatus` 는 `1`·`2` 로 호출하면 `0건` 이다
 * (테스트 DB 에 `0` 만 존재 — OQ-3). 페이지 초과는 에러가 아니라 **빈 items + 요청값
 * 에코**이고 `pageSize=0` 은 **400** 이다(지점과 동일).
 */

const GET_COURSE_LIST_PATH = '/api/v1/Course/W/sign/GetCourseList'

export const fetchCourseList = async (
  params: CourseListParams
): Promise<PagedData<CourseRow>> => {
  const res = await api.get<PagedData<CourseRow>>(GET_COURSE_LIST_PATH, { params })
  return res.data
}
