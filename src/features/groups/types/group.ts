/**
 * 관리그룹 도메인 타입 (`spec 043` T735).
 * 출처: `api-spec.md` §5-1-B "관리그룹 3종"(실측 2026-10-22) · §5-2 6번.
 *
 * 트리 노드(`GroupNode`·`SiteNode`)는 로그인 사업장 선택과 같이 쓰므로 `features/auth/types/site.ts` 에 있다.
 */

/**
 * `GET Group/W/sign/GetGroupAdminList?groupSeq` 행.
 *
 * 🔴 **본사 관리자 전원**(`codeSeq` 2·3·4)이 그룹마다 같은 행 집합으로 온다 — 그 그룹에 할당됐는지만
 * `isInclude` 로 갈린다. 🔴 없는 `groupSeq` 에도 200(전원 `false`)이라 존재 확인용으로 못 쓴다.
 * 🔴 한 관리자가 **여러 그룹**에 할당될 수 있다(실데이터).
 */
export interface GroupAdminRow {
  userSeq: number
  codeSeq: number
  codeName: string
  userName: string
  isInclude: boolean
}

/** `POST Group/W/sign/AddGroup` — 성공 `data: true`, 🔴 **새 `groupSeq` 를 주지 않는다** */
export interface AddGroupRequest {
  /** 🔴 서버는 생략해도 200 이고 트리에 안 보이는 그룹이 생긴다(B-49) — 타입이 필수로 막는다 */
  parentGroupSeq: number
  groupName: string
  /** 그 그룹에 할당할 관리자. 043 은 항상 `[]` */
  userSeq: number[]
}

/**
 * `PUT Group/W/sign/UpdateGroup`.
 *
 * 🔴🔴 `userSeq` 는 **통째로 교체**다 — 빼고 보내면 할당이 전부 지워진다(B-50). 타입이 필수로 막는다.
 * `parentGroupSeq` 를 바꾸면 그룹이 이동한다(자기 하위로는 서버가 막는다).
 */
export interface UpdateGroupRequest {
  groupSeq: number
  parentGroupSeq: number
  groupName: string
  userSeq: number[]
}
