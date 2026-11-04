import { COURSE_HISTORY_STATUS, type CourseHistoryRow } from '@/features/course-history/types'

/**
 * 최근 종료된 순찰 고르기 — `spec 069`. 오늘 끝난 회차를 종료 시각 순으로 앞 5건.
 *
 * 🔴 **서버는 시작 순으로 준다**(실측 2026-11-04) — 나중에 시작해 먼저 끝난 회차가 있어 여기서 다시 정렬한다.
 */

export const FINISHED_COURSE_LIMIT = 5

export const pickFinishedCourses = (rows: CourseHistoryRow[], today: string): CourseHistoryRow[] =>
  rows
    .filter(
      (row) => row.status !== COURSE_HISTORY_STATUS.IN_PROGRESS && row.endDt !== null && row.endDt.startsWith(today)
    )
    .sort((a, b) => (b.endDt as string).localeCompare(a.endDt as string))
    .slice(0, FINISHED_COURSE_LIMIT)
