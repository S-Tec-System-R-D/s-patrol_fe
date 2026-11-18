import type { AppUserDetail } from '../types'

/**
 * 근무자의 배치 단계 (`spec 082` US4).
 * 근무자 줄에는 **그 단계에서 할 수 있는 동작만** 보인다 — 배치 중이 아닌 사람에게 복귀 요청을 보내는 일이 없다.
 * 서버 값의 뜻은 `docs/app-api-spec.md` §2(실측 2026-11-18).
 */
export type AssignmentKind =
  /** 원 소속에 있다 — 배치와 무관 */
  | 'home'
  | 'assign-pending'
  | 'assign-rejected'
  /** 승인돼 다른 사업장에 가 있다 */
  | 'assigned'
  | 'return-pending'
  | 'return-rejected'

export interface AssignmentState {
  kind: AssignmentKind
  /** 근무자 줄에 보일 한 줄. 원 소속에 있으면 `null` */
  label: string | null
  /** 지금 할 수 있는 동작. 승인을 기다리는 동안은 없다 */
  action: 'assign' | 'return' | null
  /** 복귀 요청에 쓰는 배치 번호 */
  assignmentSeq: number | null
}

/** @param viewingSiteSeq 지금 보고 있는 사업장 — 배치돼 온 사람인지 가 있는 사람인지에 따라 문구가 달라진다 */
export const assignmentStateOf = (detail: AppUserDetail, viewingSiteSeq: number): AssignmentState => {
  const affiliation = detail.affiliation
  if (!affiliation) return { kind: 'home', label: null, action: 'assign', assignmentSeq: null }

  const { assignmentSeq, affiliationSiteName, assignApprovalStatus, returnApprovalStatus } = affiliation
  // 받는 사업장에서 보면 "어디서 왔는지", 그 밖에서는 "어디로 가는지"가 궁금하다
  const where =
    affiliation.affiliationSiteSeq === viewingSiteSeq
      ? `원 소속 ${detail.siteName}`
      : `→ ${affiliationSiteName}`

  if (assignApprovalStatus === 0) {
    return { kind: 'assign-pending', label: `배치 승인 대기 ${where}`, action: null, assignmentSeq }
  }
  if (assignApprovalStatus === 2) {
    return { kind: 'assign-rejected', label: `배치 거절됨 ${where}`, action: 'assign', assignmentSeq }
  }
  if (returnApprovalStatus === 1) {
    return { kind: 'return-pending', label: `복귀 승인 대기 · ${where}`, action: null, assignmentSeq }
  }
  if (returnApprovalStatus === 3) {
    return { kind: 'return-rejected', label: `배치 중 · 복귀 거절됨 · ${where}`, action: 'return', assignmentSeq }
  }
  return { kind: 'assigned', label: `배치 중 · ${where}`, action: 'return', assignmentSeq }
}
