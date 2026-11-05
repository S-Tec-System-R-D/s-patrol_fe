import type { HandOverRow } from '@/features/course-history/types'
import type { DashboardCourse, DashboardCoursePoint, PointStepStatus } from '../types'

/**
 * 진행 중 회차 계산 — `spec 067` → `spec 068`(서버 `status` 기준으로 교체).
 *
 * 🔴 **단계는 서버 `status` 그대로다**(OQ-067-A 해소) — 앱은 순서를 강제하지 않고, 건너뛴 지점은 서버가
 * 그 순간 `3` 으로 바꾼다. 067 의 "마지막 인증보다 앞인데 미인증 = 건너뜀" 계산은 지웠다.
 * `2` 순찰제외는 실데이터 0건(OQ-18) — 대기와 같게 그린다.
 */

const STEP_BY_STATUS: Partial<Record<number, PointStepStatus>> = {
  4: 'done',
  3: 'skipped',
  1: 'next',
}

export const pointStep = (status: number): PointStepStatus => STEP_BY_STATUS[status] ?? 'pending'

export const pointSteps = (points: DashboardCoursePoint[]): PointStepStatus[] =>
  points.map((point) => pointStep(point.status))

/** 다음 지점 = `status 1`(진행중). 없으면 `null` */
export const nextPoint = (points: DashboardCoursePoint[]): DashboardCoursePoint | null =>
  points.find((point) => pointStep(point.status) === 'next') ?? null

export const skippedCount = (points: DashboardCoursePoint[]): number =>
  points.filter((point) => pointStep(point.status) === 'skipped').length

export const checkedCount = (points: DashboardCoursePoint[]): number =>
  points.filter((point) => pointStep(point.status) === 'done').length

/**
 * 지금의 경과 분 = 응답의 `elapsedSec` + 받은 뒤 지난 시간. 멈춘 회차(교대 요청 중)는 더하지 않는다.
 *
 * 🔴 **기준은 화면이 응답을 받은 시각**(`receivedAt`)이다 — 서버 `startDt` 로 세면 서버 · PC 시계가 어긋난
 * 만큼 틀리고, 멈춘 시간도 다시 들어간다(사용자 결정 2026-11-03).
 */
export const elapsedMinAt = (course: DashboardCourse, receivedAt: number, now: number): number => {
  const sinceReceived = course.pausedYn ? 0 : Math.max(now - receivedAt, 0) / 1000
  return Math.floor((course.elapsedSec + sinceReceived) / 60)
}

/** 🔴 `totalMin 0` = 기준 없음 — 막대 · 시간초과를 판단하지 않는다(코스 65) */
export const hasStandard = (course: DashboardCourse): boolean => course.totalMin > 0

/** 경과 / 기준. 기준이 없으면 0 */
export const elapsedRatio = (course: DashboardCourse, elapsedMin: number): number =>
  hasStandard(course) ? elapsedMin / course.totalMin : 0

/** 기준을 넘긴 분. 넘지 않았거나 기준이 없으면 0 */
export const overtimeMin = (course: DashboardCourse, elapsedMin: number): number =>
  hasStandard(course) ? Math.max(elapsedMin - course.totalMin, 0) : 0

/**
 * 지금 순찰자 = 마지막 교대를 받은 사람. 교대 기록이 없으면 `users` 마지막 · 비어 올 때가 있다(회차 83 — OQ-17).
 *
 * 🔴 **`users` 만 보면 틀린다** — 사람별로 한 번씩만 와서 A → B → A 는 `[A, B]` 다(회차 101). 마지막이 B 로 읽힌다.
 */
export const currentUserName = (course: DashboardCourse, handOvers: HandOverRow[] = []): string | null =>
  handOvers.at(-1)?.toUserName ?? course.users.at(-1)?.userName ?? null

/** 문제 있는 코스가 위로 — 시간초과 먼저, 그다음 경과 비율이 높은 순 */
export const sortActiveCourses = (
  courses: DashboardCourse[],
  receivedAt: number,
  now: number
): DashboardCourse[] => {
  const elapsed = new Map(courses.map((course) => [course.historySeq, elapsedMinAt(course, receivedAt, now)]))
  const over = (course: DashboardCourse) => (overtimeMin(course, elapsed.get(course.historySeq)!) > 0 ? 1 : 0)
  const ratio = (course: DashboardCourse) => elapsedRatio(course, elapsed.get(course.historySeq)!)
  return [...courses].sort((a, b) => over(b) - over(a) || ratio(b) - ratio(a))
}
