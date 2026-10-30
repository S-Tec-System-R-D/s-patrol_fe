/**
 * 대시보드 **화면 모양(view model)** — `spec 067`.
 *
 * 🔴 **서버 응답 타입이 아니다.** 대시보드 API 는 아직 없다(전부 새로 만들어야 한다). 화면을
 * 고정 데이터로 먼저 그려 보고, 확정되면 이 타입이 **백엔드 요청서의 초안**이 된다 — API 가
 * 붙으면 실측 응답 타입을 따로 두고 이쪽으로 옮긴다(`CLAUDE.md` B4 "서버 응답이 메인").
 */

/** 오늘 숫자 4칸 */
export interface DashboardKpi {
  completedToday: number
  incompleteToday: number
  /** ⚠️ 정의 미정 — 끝난 회차만인지, 진행 중 초과까지인지(OQ-067-B) */
  overtimeToday: number
  pendingDeployments: number
}

/** 진행 중 회차의 지점 하나 — 코스 편성 순서대로 온다 */
export interface ActiveCoursePoint {
  orderNo: number
  pointName: string
  checked: boolean
}

/** 지금 돌고 있는 회차 하나 */
export interface ActiveCourse {
  historySeq: number
  courseName: string
  userName: string
  /** 순찰 중에 근무자가 바뀌었다 */
  swapped: boolean
  /** ISO 8601(타임존 없음) */
  startDt: string
  elapsedMin: number
  /** 코스 기준 소요 시간 */
  standardMin: number
  points: ActiveCoursePoint[]
}

/** 최근 미완료 · 시간초과 한 줄(처리 여부 없음 — 일어난 기록일 뿐) — 값은 지점 순찰이력과 같은 사전(`pointCheckBadge`) */
export interface RecentIssueRow {
  detailSeq: number
  checkDt: string | null
  pointName: string
  courseName: string
  userName: string
  /** 지점 사전(0~4) */
  status: number
  overtimeYn: boolean
  hasMemo: boolean
}

export interface DashboardNoticeRow {
  noticeSeq: number
  title: string
  createDt: string
  isPin: boolean
}

/** 진행 중 단계 하나의 상태 — 색은 회차 상세 지도 핀과 같은 규칙 */
export type PointStepStatus = 'done' | 'skipped' | 'next' | 'pending'
