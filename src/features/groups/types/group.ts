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

/**
 * `GET Group/W/sign/GetGroupList` 의 사업장 노드 (`spec 044` T779).
 * 출처: `api-spec.md` §5-2 5번(실측 2026-10-23 — B-1 수정 직후). 응답 전량 선언(`CLAUDE.md` B4).
 *
 * `AdminSiteSelect` 의 `SiteNode` 와 같은 사업장 트리에 **목록용 필드**가 붙었다.
 */
export interface GroupListSite {
  siteSeq: number
  siteName: string
  /** 소속 그룹 — 하위 사업장도 모 사업장과 같은 값 */
  siteGroupSeq: number
  siteGroupName: string
  address: string | null
  tel: string | null
  /** 🔴 **항상 `false`** 다(B-55) — 상세가 `true` 여도. 선언만 하고 쓰지 않는다 */
  healthCheckYn: boolean
  /** 근무자 수 — `GetSiteDetail.userCount` 와 같다 */
  userCount: number
  /** 하위 사업장 수(= `children.length`) */
  count: number
  /** 최상위 사업장은 `null` */
  parentSiteSeq: number | null
  children: GroupListSite[]
}

/**
 * `GET Group/W/sign/GetGroupList` — 본사 전용, **파라미터 없음**(`?groupSeq` 를 줘도 무시하고 전체 트리).
 * 루트 1개 객체로 온다. 🔴 코스·지점 수는 없다(`GetSiteDetail` 에만 있다 — B-55).
 */
export interface GroupListNode {
  groupSeq: number
  groupName: string
  parentGroupSeq: number | null
  /** 0 회사 · 1 본부 · 2 지사 — 🔴 단계는 이 값으로만 판단한다 */
  layer: number
  /** 🔴 `layer` 와 어긋나는 그룹이 있다(G6: layer 1 · depth 0, B-55) — 쓰지 않는다 */
  depth: number
  /** 자손 그룹 포함 사업장 수(하위 사업장 포함) */
  count: number
  sites: GroupListSite[]
  children: GroupListNode[]
}
