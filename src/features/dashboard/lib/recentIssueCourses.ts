import { COURSE_HISTORY_STATUS, type CourseHistoryRow } from '@/features/course-history/types'

/**
 * 최근 미완료 · 시간초과 고르기 — `spec 073` T1210 · T1211.
 * 🔄 `spec 079` D13 — **회차 상태로만** 고른다: 서버 `미완료`(도중 종료) 또는 시간초과. 지점이 빠졌어도 서버 `완료` 면
 * 들어오지 않는다(D11 의 "미인증 지점이 있는 회차" 를 되돌렸다 — 회차 줄에 지점 결과를 섞지 않는다).
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
