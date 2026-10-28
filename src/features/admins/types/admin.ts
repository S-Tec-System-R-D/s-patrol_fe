/**
 * 본사 관리자 도메인 타입 (`spec 056` T991).
 * 출처: `api-spec.md` §5-1-C(실측 2026-10-27). 응답 필드는 실측 그대로 전량 선언한다(`CLAUDE.md` B4) — 어댑터 없음.
 */

/** `admins[].groups` — 그 관리자의 **직접 할당** 그룹 */
export interface AdminGroupRef {
  groupSeq: number
  groupName: string
}

/** `GetAdminList` 노드의 관리자 1명 */
export interface AdminListItem {
  userSeq: number
  userName: string
  phone: string
  /** 2 시스템관리자 · 3 Master · 4 매니저 */
  codeSeq: number
  codeName: string
  /** 🔴 `true` = 전체 그룹 담당(시스템관리자 · Master) — 이때 `groups` 는 `[]` */
  allGroupYn: boolean
  groups: AdminGroupRef[]
}

/**
 * `GET AdminUser/W/sign/GetAdminList` 응답 = **그룹 트리 루트 1개**(배열 아님).
 * 🔴 `admins` 는 **위에서 물려받은 관리자까지** 노드마다 반복된다(전체 담당 + 상위 할당 + 그 노드 할당).
 */
export interface AdminGroupNode {
  groupSeq: number
  groupName: string
  parentGroupSeq: number | null
  layer: number
  depth: number
  admins: AdminListItem[]
  children: AdminGroupNode[]
}

/** `GET AdminUser/W/sign/GetAdminDetail?userSeq` — 🔴 시스템관리자 · 현장 계정은 400 */
export interface AdminDetail {
  userSeq: number
  codeSeq: number
  /** 사번 — 화면에 표시하지 않는다(사용자 결정 2026-10-27) */
  loginId: string
  name: string
  phone: string
  /** 🔴 Master `null`(전체) · 매니저 `number[]`(해제하면 `[]`) */
  groupSeq: number[] | null
}

/** `POST AdminUser/W/sign/AddAdmin` — 성공 `data: true`, 🔴 **새 `userSeq` 를 주지 않는다** */
export interface AddAdminRequest {
  codeSeq: number
  loginId: string
  loginPw: string
  name: string
  phone: string
  /** 매니저만 싣는다 */
  groupSeq?: number[]
}

/** `PUT AdminUser/W/sign/UpdateAdmin` — 🔴 **보낸 필드만 바뀐다**(생략 = 유지). `groupSeq` 는 할당 교체 */
export interface UpdateAdminRequest {
  userSeq: number
  name?: string
  phone?: string
  groupSeq?: number[]
}

/** `PUT AdminUser/W/sign/ResetAdminPassword` — 즉시 반영(실측) */
export interface ResetAdminPasswordRequest {
  userSeq: number
  loginPw: string
}
