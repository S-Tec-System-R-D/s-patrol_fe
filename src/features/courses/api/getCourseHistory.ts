import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { CourseHistoryParams, CourseHistoryRow } from '../types'

/**
 * 코스 순찰이력 조회.
 *
 * `GET /api/v1/History/W/sign/GetCourseHistory`
 *
 * ✅ **실측 완료(2026-10-12)** — `api-spec.md` "코스이력 조회 파라미터" 블록:
 * - `courseSeq` **를 받는다.** 코스 하나의 이력만 한 요청으로 가져올 수 있다
 * - 기간은 **`yyyy-MM-dd`** 로 충분하다(ISO·공백 구분과 결과가 같다)
 * - `toDt` 는 **그 날을 포함한다**(같은 날로 주면 그 날 건수가 온다)
 * - 🔴 **`from > to` 는 에러가 아니라 200 + 0건** 이다 — 뒤집어 보내면 "이력 없음" 으로
 *   보인다. 구간을 만드는 쪽이 순서를 보장해야 한다
 * - 🔴 잘못된 날짜 형식은 **400 + ProblemDetails**(`errors.fromDt`) — 래퍼가 아니라
 *   **에러 형태 B** 다(§3)
 * - `eventType` 은 **코스 상태 필터**다(OQ-5 해소): 0 진행중 / 1 완료 / 2 미완료.
 *   수치로 확인됐다 — 1(19건) + 2(27건) = 전체(46건)
 *
 * 🔴 **집계는 서버가 해 주지 않는다.** 평균 소요·인증률은 이 응답의 행을 프론트가
 * 더한다(`lib/courseHistoryStats.ts`) — 그래서 기간을 30일로 묶었다.
 */

const GET_COURSE_HISTORY_PATH = '/api/v1/History/W/sign/GetCourseHistory'

export const fetchCourseHistory = async (
  params: CourseHistoryParams
): Promise<PagedData<CourseHistoryRow>> => {
  const res = await api.get<PagedData<CourseHistoryRow>>(GET_COURSE_HISTORY_PATH, { params })
  return res.data
}
