import type { AppDateRange } from '@/components/app/AppDatePicker'
import { isWithinDateRange } from '@/lib/dateRangeQuery'
import { isCourseResult } from '@/features/patrol-zones/lib/courseHistoryOptions'
import type { ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'

/**
 * 코스 순찰이력 필터.
 *
 * - 순수 함수다. 데이터를 인자로 받으므로 API 연동 시 호출부만 교체된다(spec §3).
 * - 조건은 **AND 결합**. 빈 값은 해당 조건을 적용하지 않는다.
 * - 알 수 없는 `result`(손으로 고친 URL)는 **그 조건만 무시**한다 — 화면을 비우지 않는다.
 * - `courseId`는 목 데이터에 ID가 없어 코스명과 비교한다. 키 이름은 `data-model.md` §5-4 유지.
 */

export interface CourseHistoryFilter {
  range: AppDateRange
  courseId?: string
  result?: string
}

export const filterCourseHistory = (
  rows: ZonePatrolType[],
  { range, courseId, result }: CourseHistoryFilter
): ZonePatrolType[] =>
  rows.filter((row) => {
    if (!isWithinDateRange(row.startedAt, range)) return false
    if (courseId && row.name !== courseId) return false
    if (result && isCourseResult(result) && row.result !== result) return false
    return true
  })
