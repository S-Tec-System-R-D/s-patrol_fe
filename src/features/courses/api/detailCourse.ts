import api from '@/lib/axios'
import type { CourseDetail } from '../types'

/**
 * 순찰코스 상세 조회.
 *
 * `GET /api/v1/Course/W/sign/GetCourseDetail?courseSeq=`
 *
 * 🔴 **응답에 `siteSeq` 가 없다**(OQ-9). 그런데 `UpdateCourse` 는 `siteSeq` 를 요구하므로
 * 수정 요청을 만들 때 `getSiteSeq()`(spec 021)로 **보충해야 한다** — 상세 응답만으로는
 * 수정 호출을 구성할 수 없다.
 *
 * ⚠️ 목록에 있는 `courseStatusCode`·`pointCount` 가 **상세에는 없다.** 상태 뱃지가
 * 필요하면 목록 값을 들고 오거나 생략한다(추측으로 만들지 않는다).
 *
 * 🔴 지점 상세(`DetailPoint`)와 달리 **엔드포인트 이름이 `Get~` 으로 시작한다**
 * (`DetailCourse` 가 아니다). 이름 규칙이 도메인마다 다르다.
 */

const GET_COURSE_DETAIL_PATH = '/api/v1/Course/W/sign/GetCourseDetail'

export const fetchCourseDetail = async (courseSeq: number): Promise<CourseDetail> => {
  const res = await api.get<CourseDetail>(GET_COURSE_DETAIL_PATH, {
    params: { courseSeq },
  })
  return res.data
}
