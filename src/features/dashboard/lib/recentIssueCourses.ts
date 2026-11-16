import {
  COURSE_HISTORY_STATUS,
  POINT_HISTORY_STATUS,
  type CheckDetailRow,
  type CourseHistoryRow,
} from '@/features/course-history/types'

/**
 * 최근 미인증 · 시간초과 고르기 — `spec 073` T1210 · T1211.
 * 🔄 `spec 079` D11 — 서버 `미완료` 상태가 아니라 **미인증 지점이 있는 회차**(`checkedCount < pointCount`)를 고른다.
 * 서버 `완료` 인데 지점이 빠진 회차도 들어온다(실측 41건 중 25건).
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
        (row.checkedCount < row.pointCount || row.overtimeYn)
    )
    .sort((a, b) => (b.endDt as string).localeCompare(a.endDt as string))
    .slice(0, RECENT_ISSUE_COURSE_LIMIT)

/** 미인증 지점 — 지점 상태 `3` 만(순찰제외는 미인증이 아니다). 순번 순 */
/** 오늘 끝난 회차의 미인증 지점 수 — 대시보드 오늘 숫자(D11). 서버 요약에 없어 최근 회차(최대 100건)로 센다 */
export const todayMissedPoints = (rows: CourseHistoryRow[], today: string): number =>
  rows
    .filter((row) => row.status !== COURSE_HISTORY_STATUS.IN_PROGRESS && row.endDt?.startsWith(today))
    .reduce((sum, row) => sum + Math.max(row.pointCount - row.checkedCount, 0), 0)

export const missedPointNames = (details: CheckDetailRow[]): string[] =>
  details
    .filter((detail) => detail.status === POINT_HISTORY_STATUS.INCOMPLETE)
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((detail) => detail.pointName)
