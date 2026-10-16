import api from '@/lib/axios'
import type { CourseHistoryDetail } from '../types'

/**
 * 코스 순찰이력 상세 (`spec 036` T496).
 *
 * `GET /api/v1/History/W/sign/GetCourseHistoryDetail?historySeq=`
 *
 * 조회계라 응답이 실측돼 있다(`api-spec.md` §5-1 16번) — `ApiResponse` 래퍼는 인터셉터가
 * 벗긴다(019).
 *
 * ⚠️ **목록 행으로 대신할 수 없다.** 상세에만 `totalMin`·`elapsedTime`·`pauseTime`·
 * `handoverCount`·`startUserSeq` 가 있고, **목록에만** `statusName`·`userList`(교대 복수)·
 * `hasMemo`·`actualElapsedTime` 이 있다. 즉 둘 중 하나로는 화면이 채워지지 않는다
 * (`useCourseDetail` 이 코스에서 같은 판단을 했다).
 */

const GET_COURSE_HISTORY_DETAIL_PATH = '/api/v1/History/W/sign/GetCourseHistoryDetail'

export const fetchCourseHistoryDetail = async (
  historySeq: number
): Promise<CourseHistoryDetail> => {
  const res = await api.get<CourseHistoryDetail>(GET_COURSE_HISTORY_DETAIL_PATH, {
    params: { historySeq },
  })
  return res.data
}
