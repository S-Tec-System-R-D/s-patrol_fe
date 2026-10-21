/**
 * ── 🔴 가정 계약 (`spec 039` T627 · T656 에서 배치 로직 반영) ─────────────────────
 *
 * **배치 API 는 아직 없다**(실서버 swagger 44종 재대조 2026-10-21 — 배치 0건). 프론트가 화면을 먼저
 * 만들고 백엔드에 요청했다: [`docs/api-request-deployment.md`](../../../../docs/api-request-deployment.md).
 *
 * 그래서 아래 타입은 **전부 가정**이다 — 기존 API 관례(`ApiResponse` 래퍼 · `PagedData` · `~Seq` number ·
 * 정수 코드 + `~Name` · ISO 타임존 없음 · 변경계 성공 `data: true`)를 따른 **가장 그럴듯한 모양**.
 * 🔴 **백엔드가 구현하면 WF-1-0 으로 실측해 이 파일과 MSW(`mocks/handlers/deployments.ts`)만 고친다.**
 * 화면 컴포넌트는 이 파일의 타입만 본다 — 가정이 다른 곳으로 퍼지지 않게 한다.
 *
 * **배치 로직**(사용자 정리 2026-10-21 · T659 에서 정정):
 * 1. 근무자가 앱에서 **사업장 · 시작일 · 종료일(선택) · 사유**로 **배치 요청** → **목적지 사업장** 관리자가 승인·거부
 * 2. 승인하면 이력(전입/전출)에 나온다 — 기간은 **요청의 시작일·종료일**
 * 3. 돌아올 때는 근무자가 앱에서 **복귀 요청** → **원소속 사업장** 관리자가 승인·거부(사용자 확인)
 * 4. 복귀를 승인하면 그 배치 이력이 **복귀일로 닫힌다**
 * 🔴 **API 는 배치(요청·승인·거부) · 복귀(요청·승인·거부)로 나뉜다**(백엔드 요청 완료). 웹은 각 목록·승인·거부만 쓴다.
 * ⚠️ T656 의 "관리자가 복귀일을 지정" 은 **폐기**됐다(복귀는 요청으로 한다).
 */

/** 요청서 1번 — 현재 사업장으로 들어온 **대기 중** 배치 요청 */
export interface DeploymentRequestRow {
  requestSeq: number
  userSeq: number
  userName: string
  fromSiteSeq: number
  fromSiteName: string
  /** = 현재 사업장(목적지 관리자가 승인한다) */
  toSiteSeq: number
  toSiteName: string
  /** 배치 시작일 — 근무자가 입력(필수) */
  startDt: string
  /** 배치 종료일 — 근무자가 입력(**선택**). `null` = 미정 → 관리자가 나중에 복귀일 지정 */
  endDt: string | null
  reason: string
  requestDt: string
}

/** 이력 상태 — 0 배치중 / 1 복귀완료 / 2 배치예정 (가정 · 서버가 날짜로 계산해 준다) */
export const DEPLOYMENT_HISTORY_STATUS = {
  ACTIVE: 0,
  RETURNED: 1,
  SCHEDULED: 2,
} as const
export type DeploymentHistoryStatusCode =
  (typeof DEPLOYMENT_HISTORY_STATUS)[keyof typeof DEPLOYMENT_HISTORY_STATUS]

/** 요청서 4·5번 — 승인된 배치(거부된 요청은 이력이 아니다) */
export interface DeploymentHistoryRow {
  historySeq: number
  userSeq: number
  userName: string
  fromSiteSeq: number
  fromSiteName: string
  toSiteSeq: number
  toSiteName: string
  reason: string
  startDt: string
  /** 종료(복귀)일 — 근무자 입력 또는 관리자 지정. `null` = 미정 */
  endDt: string | null
  /**
   * 🔴 **상태는 서버가 날짜로 계산해 준다고 가정한다** — 시작 전 = 배치예정, 종료일이 지나면 복귀완료,
   * 그 사이(종료 미정 포함) = 배치중. 프론트가 오늘 날짜로 다시 계산하면 서버와 기준 시각이 어긋날 수 있다
   */
  status: DeploymentHistoryStatusCode
  statusName: string
}

/**
 * 복귀 요청 — **원소속 사업장**(= 현재 사업장)으로 들어온 대기 중 복귀 요청(T659).
 * 🔴 **우리 소속으로 다른 곳에 나가 있는 사람**(전출)이 보낸다. 원소속 관리자가 승인한다(사용자 확인 2026-10-21)
 */
export interface ReturnRequestRow {
  requestSeq: number
  userSeq: number
  userName: string
  /** 닫힐 배치 이력(전출) */
  historySeq: number
  /** 지금 배치돼 있는 사업장 */
  fromSiteSeq: number
  fromSiteName: string
  /** 돌아올 사업장 = 원소속 = 현재 사업장 */
  toSiteSeq: number
  toSiteName: string
  /** 복귀일 — 근무자가 입력. 승인하면 이력의 종료일이 된다 */
  returnDt: string
  reason: string
  requestDt: string
}

/** 요청서 — 현재 사업장 기준 숫자 */
export interface DeploymentSummary {
  /** 배치 나간 인원 — 이 사업장 소속인데 지금 타 사업장에 **배치중**인 사람(예정 제외) */
  outCount: number
  /** 배치 온 인원 — 타 사업장 소속인데 지금 여기 **배치중**인 사람(예정 제외) */
  inCount: number
  /** 대기 중 **배치** 요청 — KPI · 사이드바 뱃지(사용자 결정: 배치만 센다) */
  pendingCount: number
  /** 대기 중 **복귀** 요청 — 복귀 요청 탭 뱃지에만 쓴다(T659) */
  pendingReturnCount: number
}

/** 요청 종류 — 승인·거부 버튼·폼·훅이 같은 모양이라 이 값 하나로 갈린다(T659) */
export type RequestKind = 'deploy' | 'return'

/** 이력 방향 — 0 전출(이 사업장 → 타) / 1 전입(타 → 이 사업장) (가정) */
export const DEPLOYMENT_DIRECTION = {
  OUT: 0,
  IN: 1,
} as const
export type DeploymentDirectionCode =
  (typeof DEPLOYMENT_DIRECTION)[keyof typeof DEPLOYMENT_DIRECTION]

export interface DeploymentRequestListParams {
  siteSeq: number
  pageNumber: number
  pageSize: number
}

/**
 * 🔴 **이력은 엔드포인트 1개 + `direction`** 으로 가정한다(OQ-039-B) — 전출·전입은 컬럼이 같고 방향만
 * 다르다. 백엔드가 둘로 나누면 API 함수만 둘이 된다.
 */
export interface DeploymentHistoryParams {
  siteSeq: number
  direction: DeploymentDirectionCode
  /**
   * 상태 필터 — 생략하면 전체 (가정 · T649h).
   * 🔴 KPI(지금 나가/와 있는 **인원**)를 누르면 `배치중` 으로 좁힌다 — 그래야 숫자와 행 수가 맞는다
   */
  status?: DeploymentHistoryStatusCode
  /**
   * 근무자 이름 **부분 일치**(가정 · T658). 순찰이력(`GetPointHistory`·`GetCourseHistory`)이 같은 이름·
   * 같은 방식(`userName` 부분 문자열)이라 맞췄다
   */
  userName?: string
  pageNumber: number
  pageSize: number
}

export interface ApproveDeploymentRequest {
  requestSeq: number
}

export interface RejectDeploymentRequest {
  requestSeq: number
  /** 필수. 근무자 앱에만 보인다(WEB 미표시) */
  rejectReason: string
}

/** 복귀 요청 승인 — 승인하면 그 배치 이력이 복귀일로 닫힌다(가정) */
export interface ApproveReturnRequest {
  requestSeq: number
}

/** 복귀 요청 거부 — 사유 필수(배치 거부와 같다) */
export interface RejectReturnRequest {
  requestSeq: number
  rejectReason: string
}
