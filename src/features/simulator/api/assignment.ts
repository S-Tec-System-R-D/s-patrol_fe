import { appRequest } from './appClient'

/**
 * 배치 · 복귀 · 근무 상태 (`spec 082` US4) — 규칙은 `docs/app-api-spec.md` §3-4.
 * 전부 **근무자 토큰 + 앱 API** 다. 승인 · 거절은 여기 없다(웹 화면에서 한다 — 그 화면이 테스트 대상이다).
 */
const USER = '/api/v1/User/M/sign'

/** 앱 목록은 커서 방식이다(웹의 페이지 방식과 다르다) */
interface CursorList<T> {
  items: T[]
  lastCursor: number | null
  hasMore: boolean
}

/** `GET User/M/sign/UserAssignmentList` 행 — 사업장에 들어온 배치(`gubun=0`) · 복귀(`gubun=1`) 신청 */
export interface PendingAssignment {
  assignmentSeq: number
  /** 배치 신청이면 **보내는** 사업장, 복귀 신청이면 **배치돼 있던** 사업장 이름 */
  siteName: string
  userSeq: number
  userName: string
  reason: string | null
  startDt: string
  endDt: string | null
}

/** `GET User/M/sign/GetAssignmentHistory` 행 — 🔴 **승인된 배치만** 나온다(대기 · 거절은 없다) */
export interface AssignmentHistoryRow {
  assignmentSeq: number
  /** 배치된 사업장 */
  siteSeq: number
  siteName: string
  startDt: string
  endDt: string | null
  /** 복귀까지 끝났는가 — `false` 면 지금 배치 중 */
  completeYn: boolean
  completeDt: string | null
}

export interface AssignmentRequest {
  userSeq: number
  fromSiteSeq: number
  toSiteSeq: number
  reason: string
  /** `YYYY-MM-DDTHH:mm:ss` (타임존 없음) */
  startDt: string
  endDt: string | null
}

/** 근무자 본인이 보낸다. 신청 중이거나 배치 중이면 400 */
export const requestAssignment = (loginId: string, request: AssignmentRequest): Promise<boolean> =>
  appRequest<boolean>(loginId, { method: 'POST', url: `${USER}/UserAssignment`, data: request })

export const requestAssignmentReturn = (loginId: string, assignmentSeq: number): Promise<boolean> =>
  appRequest<boolean>(loginId, {
    method: 'POST',
    url: `${USER}/UserAssignmentReturn`,
    data: { assignmentSeq },
  })

/** 그 사업장에 들어와 있는 신청 — 근무자 토큰으로도 읽힌다(실측 2026-11-18) */
export const fetchPendingAssignments = async (
  loginId: string,
  siteSeq: number,
  kind: 'assignment' | 'return'
): Promise<PendingAssignment[]> => {
  const list = await appRequest<CursorList<PendingAssignment>>(loginId, {
    url: `${USER}/UserAssignmentList`,
    params: { siteSeq, gubun: kind === 'assignment' ? 0 : 1, pageSize: 100 },
  })
  return list.items
}

export const fetchAssignmentHistory = async (
  loginId: string,
  userSeq: number
): Promise<AssignmentHistoryRow[]> => {
  const list = await appRequest<CursorList<AssignmentHistoryRow>>(loginId, {
    url: `${USER}/GetAssignmentHistory`,
    params: { userSeq, pageSize: 100 },
  })
  return list.items
}

/** 근무 시작(`true`) · 종료(`false`). 같은 값을 다시 보내도 200 이다 */
export const setWorkStatus = (loginId: string, workYn: boolean): Promise<boolean> =>
  appRequest<boolean>(loginId, { method: 'PUT', url: `${USER}/WorkStatusChanged`, data: { workYn } })
