import {
  COURSE_HISTORY_STATUS,
  POINT_HISTORY_STATUS,
  type CheckDetailRow,
  type CourseHistoryRow,
} from '@/features/course-history/types'

/**
 * 최근 미완료 · 시간초과 고르기 — `spec 073` T1210 · T1211.
 *
 * 🔴 **회차 1건 = 1행**(분석 문서 §2) — 지점 이력 2번 호출(`spec 068`)은 지점마다 한 줄이라 순찰 1건이 여러 줄로
 * 쪼개졌다. 이제 `최근 종료된 순찰` 과 같은 100건(어제~오늘)에서 고른다 — 목록 요청이 늘지 않는다.
 * 🔴 진행 중인 회차는 넣지 않는다 — 진행 중 카드가 이미 말한다.
 */

export const RECENT_ISSUE_COURSE_LIMIT = 5

export const pickIssueCourses = (rows: CourseHistoryRow[]): CourseHistoryRow[] =>
  rows
    .filter(
      (row) =>
        row.status !== COURSE_HISTORY_STATUS.IN_PROGRESS &&
        row.endDt !== null &&
        (row.status === COURSE_HISTORY_STATUS.INCOMPLETE || row.overtimeYn)
    )
    .sort((a, b) => (b.endDt as string).localeCompare(a.endDt as string))
    .slice(0, RECENT_ISSUE_COURSE_LIMIT)

/** 놓친 지점 — 지점 상태 `미완료` 만(순찰제외는 놓친 것이 아니다). 순번 순 */
export const missedPointNames = (details: CheckDetailRow[]): string[] =>
  details
    .filter((detail) => detail.status === POINT_HISTORY_STATUS.INCOMPLETE)
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((detail) => detail.pointName)
