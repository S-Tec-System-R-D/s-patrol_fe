/**
 * ── 배치 API 응답·요청 타입 (`spec 042` — 실측 2026-10-21 · 재실측 2026-10-22) ──────────
 *
 * `api-spec.md` §5-1-B "배치 10종" 그대로다(B4 — 안 쓰는 필드도 둔다). 039 의 가정 계약을 대체했다.
 *
 * - 요청 목록 2종(`GetAssignmentList` · `GetAssignmentReturnList`)은 🔴 **배열, 페이징 없음** · 같은 행 모양
 * - 🔴 복귀 요청 행의 `from → to` 는 **원래 배치 방향**이다(복귀 경로가 아니다)
 * - 이력 3종은 행 모양이 조금씩 다르다 — 전입은 `fromSiteName` 만, 전출은 `toSiteName` 만, 근무자별은 `siteName`(도착)
 * - 서버에 없는 것(요청 중): 복귀일(B-46 ②) · 이력 사유(B-47)
 * - 이력 3종 `status` 필터 · 요약 `pendingReturnCount` 는 042 후속(2026-10-22 실측)에서 생겼다
 *
 * ⚠️ `UserAssignment`·`UserAssignmentReturn`(요청 생성)은 웹이 쓰지 않는다 — 근무자 앱 경로다.
 */

/** 대기 중 배치 요청 · 복귀 요청 한 행 */
export interface AssignmentRequestRow {
  assignmentSeq: number
  fromSiteSeq: number
  fromSiteName: string
  toSiteSeq: number
  toSiteName: string
  startDt: string
  /** 근무자가 입력한 종료일(선택). `null` = 미정 */
  plannedEndDt: string | null
  reason: string
  createDt: string
  userSeq: number
  userName: string
}

/** 이력 상태 — 서버가 계산한다(실측: 시작 전 0 · 진행 1 · 복귀 승인 2) */
export const ASSIGNMENT_STATUS = {
  SCHEDULED: 0,
  ACTIVE: 1,
  RETURNED: 2,
} as const
export type AssignmentStatusCode = (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS]

/** 이력 3종 공통 */
export interface AssignmentHistoryBase {
  assignmentSeq: number
  startDt: string
  endDt: string | null
  completeYn: boolean
  /** 복귀 승인 시각 — 근무자 상세 배치 이력만 쓴다(OQ-042-E 해소, `spec 049`) */
  completeDt: string | null
  status: AssignmentStatusCode
  statusName: string
}

/** 전입 이력 — 출발 사업장만 온다(도착 = 조회한 사업장) */
export interface AssignmentInHistoryRow extends AssignmentHistoryBase {
  userName: string
  fromSiteName: string
}

/** 전출 이력 — 도착 사업장만 온다(출발 = 조회한 사업장) */
export interface AssignmentOutHistoryRow extends AssignmentHistoryBase {
  userName: string
  toSiteName: string
}

/** 근무자별 배치 이력 — 사업장 무관, 그 사람의 배치 전체 */
export interface UserAssignmentHistoryRow extends AssignmentHistoryBase {
  /** 배치된(도착) 사업장 */
  siteSeq: number
  siteName: string
}

/**
 * 🔴 **복귀 안 한 배치 건수**다 — 시작 전(배치예정)도 센다(실측). "지금 나가/와 있는 인원" 이 아니다(OQ-042-C)
 */
export interface AssignmentCount {
  outCount: number
  inCount: number
  pendingCount: number
  /** 대기 중 복귀 요청 — 🔴 원소속(출발) 사업장에서 센다(복귀 요청 목록과 같은 쪽) */
  pendingReturnCount: number
}

/** 요청 종류 — 승인·반려 버튼·훅이 같은 모양이라 이 값 하나로 갈린다 */
export type RequestKind = 'deploy' | 'return'

export interface AssignmentHistoryParams {
  siteSeq: number
  /** 근무자 이름 **부분 일치**(실측 ✅) */
  userName?: string
  /** 상태 필터 — 빼면 전체. 0~2 밖은 400(실측) */
  status?: AssignmentStatusCode
  pageNumber: number
  pageSize: number
}

export interface UserAssignmentHistoryParams {
  userSeq: number
  status?: AssignmentStatusCode
  pageNumber: number
  pageSize: number
}

/**
 * 배치·복귀 승인/반려 공통 바디.
 * 🔴 **`approved` 는 항상 보낸다** — 빼면 서버가 반려로 처리한다(B-48, bool 기본값)
 */
export interface AssignmentApproveRequest {
  assignmentSeq: number
  approved: boolean
}
