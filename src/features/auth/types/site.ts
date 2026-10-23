/**
 * 사업장 선택 도메인 타입.
 * 출처: `docs/api-spec.md` §2-2(선택 규칙) · §5-2(실측 응답).
 *
 * 선택 확정 API가 없다 — 서버는 고른 `siteSeq`를 기억하지 않는다. 클라이언트가 보관하고
 * 매 요청 쿼리로 전달한다(`spec 021` §3 규칙 1). **JWT 클레임에도 없다** —
 * `AccessTokenClaims`를 뒤져도 사업장 정보는 나오지 않는다.
 */

/**
 * `GET /api/v1/Login/W/sign/UserSiteSelect` 응답. **현장 계정 전용**이고
 * 본사 계정으로 호출하면 403이다(`AdminSiteSelect`와 상호 배타 — `api-spec.md:286·287`).
 *
 * 🔴🔴 **루트도 선택 대상이다**(사용자 결정 2026-10-19 — 설계를 뒤집었다). 처음에는
 * 루트를 "소속 지사·상위 조직" 으로 보고 제외했는데, **실데이터가 그 전제를 부정한다**:
 * 루트(`siteSeq 6`)에 코스이력 **48건**이 있고 children(7·8)은 **전부 0건**이다
 * (실측 2026-10-19). 제외하면 현장관리자가 실데이터에 닿을 수 없다. `lib/siteOptions.ts`
 * 가 루트 + children 을 **동일하게** 나열한다.
 */
export interface UserSiteSelectData {
  /** 🔴 **선택 대상이다**(2026-10-19 정정). 조직 위계상 상위지만 자기 지점·코스를 갖는다 */
  siteSeq: number
  siteName: string
  children: UserSiteChild[]
}

/**
 * 루트 아래 사업장 1건. **루트와 나란히 선택지에 오른다**(2026-10-19).
 *
 * 🔴 **필드명이 루트와 다르다**(`childSiteSeq` ≠ `siteSeq`). 서버 내부 불일치이고,
 * 우리 옛 이름으로 되돌리지 않는다 — 어댑터(`lib/siteOptions.ts`)가 `SiteOption`으로
 * 정규화한다(`CLAUDE.md` B4).
 *
 * 🔴 **1단 평면이다. 재귀가 아니다.** 본사쪽 `AdminSiteSelect`의 `SiteNode`는
 * 자기 `children`을 갖는 트리지만(`api-spec.md` §5-2 3번), 이쪽은 1단으로 끝난다.
 */
export interface UserSiteChild {
  /** ← `siteSeq` 아님. **이 값이 선택 결과로 쓰이는 siteSeq**다 */
  childSiteSeq: number
  /** ← `siteName` 아님 */
  childSiteName: string
  /** ← `parentSiteSeq` 아님. 화면에 쓰지 않지만 실측 필드라 선언한다(`CLAUDE.md` B4) */
  parentSeq: number
}

/**
 * `GET /api/v1/Login/W/sign/AdminSiteSelect` 의 사업장 노드. **본사 계정 전용**이다.
 *
 * 🔴 **사업장도 자기 트리를 갖는다**(`children` 재귀) — 현장쪽 `UserSiteChild` 와 달리 1단으로 끝나지 않는다.
 * 실측 2026-10-22: `테테테(수정)1`(3) 아래 `수정사업장테테`(4).
 */
export interface SiteNode {
  siteSeq: number
  siteName: string
  /** 최상위 사업장은 `null` */
  parentSiteSeq: number | null
  children: SiteNode[]
}

/**
 * `AdminSiteSelect` 응답 = **관리그룹 트리 루트 1개**(배열 아님). 그룹과 사업장의 **이중 재귀**다.
 * 출처: `api-spec.md` §2-2 · §5-2(실측 2026-10-19 · 재확인 2026-10-22).
 *
 * 🔴 **관리그룹 트리의 유일한 출처다**(`spec 043`) — `GetGroupList` 는 500 이다(B-1). 로그인 사업장 선택과
 * 본사 관리그룹 트리가 이 응답 하나를 같이 쓴다.
 */
export interface GroupNode {
  groupSeq: number
  groupName: string
  /** 루트는 `null`. 루트는 `groupSeq 1 '에스텍시스템'` 고정 */
  parentGroupSeq: number | null
  /** 0 회사 · 1 본부 · 2 지사. `depth` 와 값이 같게 관측됐다 */
  layer: number
  depth: number
  /** 이 그룹에 **직접** 속한 사업장. 하위 그룹의 사업장은 `children` 쪽에 있다 */
  sites: SiteNode[]
  children: GroupNode[]
}

/**
 * 선택 UI·저장이 쓰는 공용 형태.
 *
 * 현장(`UserSiteSelect`)과 본사(`AdminSiteSelect`)의 필드명·모양이 서로 다르므로 한 형태로
 * 모은다. 사이트별 어댑터는 `lib/siteOptions.ts`.
 */
export interface SiteOption {
  siteSeq: number
  siteName: string
}
