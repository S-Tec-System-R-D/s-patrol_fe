/**
 * 비상연락망 도메인 타입 (`spec 057` T1016).
 * 출처: `api-spec.md` §5-1-C(실측 2026-10-27). 응답 필드는 실측 그대로 전량 선언한다(`CLAUDE.md` B4) — 어댑터 없음.
 */

/** 🔴 대문자로 온다. 서버는 소문자도 받지만 우리는 대문자로 보낸다 */
export type EmergencyDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface EmergencyUser {
  userSeq: number
  userName: string
  phone: string
  codeSeq: number
  codeName: string
}

/** `GET Emergency/W/sign/GetEmergency?siteSeq` — 🔴 항상 7개(없는 사업장도 빈 7요일) */
export interface EmergencyDayEntry {
  day: EmergencyDay
  users: EmergencyUser[]
}

/** 후보 트리의 사람 */
export interface EmergencyTreeMember extends EmergencyUser {
  /** 🔴 근무자 전용 — 다른 사업장에 배치 중이면 `true`(백엔드 확인 2026-10-27) */
  assignmentYn: boolean
  /** 무시한다(백엔드: 신경 쓰지 않아도 됨) — 값이 늘 `null` 이라 실제 타입을 모른다 */
  assignmentType: unknown
  /** 배치 중일 때만 배치된 사업장. 아니면 `null`(그룹 트리 위치가 소속) */
  assignedSiteSeq: number | null
  assignedSiteName: string | null
}

/**
 * `GET Emergency/W/sign/GetEmergencyUserTree` 노드 — 🔴 파라미터 없음 · 사업장 · 요일과 무관한 전사 후보.
 * `ROOT`(전체 관리자 — 시스템관리자 · 마스터) · `GROUP`(매니저) · `SITE`(현장관리자 · 근무자) · `UNASSIGNED`(담당 그룹 없는 매니저).
 */
export interface EmergencyTreeNode {
  nodeType: 'ROOT' | 'GROUP' | 'SITE' | 'UNASSIGNED'
  /** `ROOT` · `UNASSIGNED` 는 `null` */
  nodeSeq: number | null
  name: string
  members: EmergencyTreeMember[]
  children: EmergencyTreeNode[]
}

/** `POST AddEmergency` · `DELETE DeleteEmergency` 공통 — 성공 `data: true` */
export interface EmergencyAssignRequest {
  siteSeq: number
  userSeq: number
  day: EmergencyDay
}
