import type { DeploymentDirection, DeploymentStatus } from '@/types/enum'

// 배치 요청 목록(대기 큐) 행 — data-model.md §3-1 `DeploymentRequestSummary` 기준.
// `reason`은 목업(배치관리-신규.png) 근거로 추가된 필드(spec.md §3 참조, data-model.md 동기화 예정).
export interface DeploymentRequestSummary {
  id: string
  direction: DeploymentDirection
  workerName: string
  fromLocationName: string
  toLocationName: string
  reason: string
  status: DeploymentStatus
  requestedAt: string
  processedAt?: string
}

// 배치 이력(승인된 배치만) — 화면 표시 필드만 보유(CLAUDE.md B4).
export interface DeploymentHistoryItem {
  id: string
  workerName: string
  fromLocationName: string
  toLocationName: string
  reason: string
  startedAt: string
  endedAt?: string
}

/**
 * ── 🔴 가정 계약 (`spec 039` T627) ───────────────────────────────────────────
 *
 * **배치 API 는 아직 없다**(실서버 swagger 44종 재대조 2026-10-21 — 배치 0건). 프론트가 화면을 먼저
 * 만들고 백엔드에 요청했다: [`docs/api-request-deployment.md`](../../../../docs/api-request-deployment.md).
 *
 * 그래서 아래 타입은 **전부 가정**이다 — 기존 API 관례(`ApiResponse` 래퍼 · `PagedData` · `~Seq` number ·
 * 정수 코드 + `~Name` · ISO 타임존 없음 · 변경계 성공 `data: true`)를 따른 **가장 그럴듯한 모양**.
 * 🔴 **백엔드가 구현하면 WF-1-0 으로 실측해 이 파일과 MSW(`mocks/handlers/deployments.ts`)만 고친다.**
 * 화면 컴포넌트는 이 파일의 타입만 본다 — 가정이 다른 곳으로 퍼지지 않게 한다.
 *
 * ⚠️ 위의 구 타입 2종(`DeploymentRequestSummary`·`DeploymentHistoryItem`)은 zustand mock 시절 것이다.
 * 소비처를 옮긴 뒤 T650 에서 지운다.
 */

/** 요청서 1번 — 현재 사업장으로 들어온 **대기 중** 배치·복귀 요청 */
export interface DeploymentRequestRow {
  requestSeq: number
  userSeq: number
  userName: string
  /** 0 배치 / 1 복귀 (가정) */
  requestType: number
  requestTypeName: string
  fromSiteSeq: number
  fromSiteName: string
  /** = 현재 사업장(목적지 관리자가 승인한다) */
  toSiteSeq: number
  toSiteName: string
  reason: string
  requestDt: string
}

/** 요청서 4·5번 — 실제로 일어난 이동(거부된 요청은 이력이 아니다) */
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
  /** `null` = 아직 배치 중 */
  endDt: string | null
}

/** 요청서 7번 — 현재 사업장 기준 숫자 3개 */
export interface DeploymentSummary {
  /** 배치 나간 인원 — 이 사업장 소속인데 지금 타 사업장에 있는 사람 */
  outCount: number
  /** 배치 온 인원 — 타 사업장 소속인데 지금 여기 있는 사람 */
  inCount: number
  /** 대기 중 요청 */
  pendingCount: number
}

/** 이력 방향 — 0 전출(이 사업장 → 타) / 1 전입(타 → 이 사업장) (가정) */
export const DEPLOYMENT_DIRECTION = {
  OUT: 0,
  IN: 1,
} as const
export type DeploymentDirectionCode = (typeof DEPLOYMENT_DIRECTION)[keyof typeof DEPLOYMENT_DIRECTION]

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
