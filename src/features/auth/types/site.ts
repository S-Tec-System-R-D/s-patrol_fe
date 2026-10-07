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
 * 🔴 **루트는 선택 대상이 아니다.** 루트(`siteSeq`)는 소속 지사·상위 조직이고,
 * 현장관리자가 소속된 사업장 목록은 `children`이다(`api-spec.md` §2-2).
 */
export interface UserSiteSelectData {
  /** 루트 = 소속 지사·상위 조직. **선택 대상 아님** */
  siteSeq: number
  siteName: string
  children: UserSiteChild[]
}

/**
 * 현장관리자가 소속된 사업장 1건.
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
 * 선택 UI·저장이 쓰는 공용 형태.
 *
 * 현장(`UserSiteSelect`)과 본사(`AdminSiteSelect`)의 필드명이 서로 다르므로 한 형태로
 * 모은다. 본사 선택은 `spec 021` 범위 외(Phase 5)지만, 그때 어댑터 1개만 추가하면
 * 선택 UI를 그대로 쓸 수 있도록 타입을 사이트 중립으로 둔다.
 */
export interface SiteOption {
  siteSeq: number
  siteName: string
}
