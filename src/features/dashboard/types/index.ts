/**
 * 대시보드 응답 타입 — `spec 068`. **실측 그대로**(`docs/api-spec.md` §5-1-D 응답 타입).
 *
 * 067 의 화면 모양 타입을 서버 이름으로 바꿨다(`CLAUDE.md` B4 "서버 응답이 메인"). 어댑터는 없다 —
 * 서버 내부 불일치가 없어서다. 최근 미완료 · 시간초과 행은 `PointHistoryRow`(응답이 `GetPointHistory`
 * 와 행 단위까지 같다), 공지는 `NoticeRow` 를 그대로 쓴다.
 */

/** `GET DashBoard/W/sign/GetTodaySummary?siteSeq` — 오늘 **시작한** 회차 기준 */
export interface TodaySummary {
  completedCount: number
  incompleteCount: number
  /** 회차 단위 `overtimeYn` 을 센다 — 완료이면서 시간초과면 양쪽에 들어간다. 진행 중 초과는 미실측(OQ-067-B) */
  overtimeCount: number
  pendingAssignmentCount: number
  pendingReturnCount: number
}

/** 진행 중 회차의 지점 하나 — 코스 편성 순서대로 온다 */
export interface DashboardCoursePoint {
  detailSeq: number
  pointSeq: number
  orderNo: number
  pointName: string
  /** 지점 사전 — `0` 대기 · `1` 진행중(= 다음 지점) · `2` 순찰제외 · `3` 미완료(건너뜀) · `4` 완료 */
  status: number
  checkDt: string | null
}

/** `GET DashBoard/W/sign/GetDashboardCourseList?siteSeq` — 배열(페이징 없음) */
export interface DashboardCourse {
  historySeq: number
  courseSeq: number
  courseName: string
  startDt: string
  /** 응답 시점의 경과 — 멈춘 시간(교대 요청 중)은 뺀 값 */
  elapsedSec: number
  /** 교대 요청 중 — 경과가 늘지 않는다 */
  pausedYn: boolean
  /** 코스 기준 소요 시간. 🔴 `0` 이 온다(기준 없음 — 코스 65) */
  totalMin: number
  handoverCount: number
  /** 처음 순찰자 → **지금 순찰자가 마지막** */
  users: { userSeq: number; userName: string }[]
  points: DashboardCoursePoint[]
}

/**
 * 영역 하나의 조회 상태 — 영역마다 쿼리가 따로라 한 영역이 실패해도 나머지는 그린다.
 * 🔴 조회 중 · 실패를 "없음" 으로 보여주지 않는다(027 T324 퇴행).
 */
export type AreaState = 'ready' | 'loading' | 'error'

/** 진행 중 단계 하나의 상태 — 색은 회차 상세 지도 핀과 같은 규칙 */
export type PointStepStatus = 'done' | 'skipped' | 'next' | 'pending'
