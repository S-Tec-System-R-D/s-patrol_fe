import type { ActiveCourse, ActiveCoursePoint, PointStepStatus } from '../types'

/**
 * 진행 중 회차 계산 — `spec 067`. 화면이 계산하는 순수 함수라 API 가 붙어도 그대로 쓴다.
 *
 * ⚠️ **"건너뜀" 은 서버에 없는 개념이다** — 마지막 인증 지점보다 **앞**의 미인증 지점을 이렇게
 * 부른다. 앱이 순서대로 찍게 강제하는지는 API spec 에서 확인한다(OQ-067-A).
 */

const lastCheckedIndex = (points: ActiveCoursePoint[]): number =>
  points.reduce((last, point, index) => (point.checked ? index : last), -1)

/** 단계마다의 상태 — 인증 / 건너뜀 / 다음 / 아직 안 감 */
export const pointSteps = (points: ActiveCoursePoint[]): PointStepStatus[] => {
  const last = lastCheckedIndex(points)
  let nextAssigned = false
  return points.map((point, index) => {
    if (point.checked) return 'done'
    if (index < last) return 'skipped'
    if (!nextAssigned) {
      nextAssigned = true
      return 'next'
    }
    return 'pending'
  })
}

/** 다음 지점 = 마지막 인증 지점 뒤의 첫 미인증 지점. 다 찍었으면 `null` */
export const nextPoint = (points: ActiveCoursePoint[]): ActiveCoursePoint | null => {
  const index = pointSteps(points).indexOf('next')
  return index === -1 ? null : points[index]
}

export const skippedCount = (points: ActiveCoursePoint[]): number =>
  pointSteps(points).filter((step) => step === 'skipped').length

export const checkedCount = (points: ActiveCoursePoint[]): number =>
  points.filter((point) => point.checked).length

/** 경과 / 기준. 기준이 0 이면 비교할 수 없어 0 으로 둔다 */
export const elapsedRatio = (course: ActiveCourse): number =>
  course.standardMin > 0 ? course.elapsedMin / course.standardMin : 0

/** 기준을 넘긴 분. 넘지 않았으면 0 */
export const overtimeMin = (course: ActiveCourse): number =>
  course.standardMin > 0 ? Math.max(course.elapsedMin - course.standardMin, 0) : 0

/** 문제 있는 코스가 위로 — 시간초과 먼저, 그다음 경과 비율이 높은 순 */
export const sortActiveCourses = (courses: ActiveCourse[]): ActiveCourse[] =>
  [...courses].sort((a, b) => {
    const overA = overtimeMin(a) > 0 ? 1 : 0
    const overB = overtimeMin(b) > 0 ? 1 : 0
    if (overA !== overB) return overB - overA
    return elapsedRatio(b) - elapsedRatio(a)
  })
