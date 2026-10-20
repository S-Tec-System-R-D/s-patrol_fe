/**
 * 근무자(사용자) 서버 타입 (`spec 038` T596).
 *
 * `api-spec.md` §8·9 **실측 그대로 전량** 선언한다(안 쓰는 필드도 둔다 — CLAUDE.md B4).
 * mock 시절 `worker.ts` 는 소비처를 옮긴 뒤 T618 에서 지운다.
 *
 * 🔴 **현장관리자는 이 두 API 가 403 이다**(재실측 2026-10-21) — 서버 타입으로 만들어 두고
 * 권한 개방을 요청했다(B-41). 열리면 코드 변경 없이 동작한다.
 */

/** `GET User/W/sign/UserList` 의 행 */
export interface UserRow {
  userSeq: number
  userName: string
  loginId: string
  /** 권한 — 실측 `6` 현장 관리자 / `7` 현장 근무자. 🔴 목록에 **관리자도 섞여 온다** */
  codeSeq: number
  codeName: string
  /**
   * ⚠️ 의미 미확정(OQ-7 · OQ-038-B). 실측: 대부분 `null` + `originSiteName` = 현재 사업장명,
   * 1행만 다른 사업장 Seq·이름. 🔴 **해석하지 않는다** — Seq 가 있을 때만 이름을 그대로 보인다
   */
  originSiteSeq: number | null
  originSiteName: string | null
  /** 근무 중 여부 */
  workYn: boolean
  createDt: string
}

/**
 * `GET User/W/sign/UserDetail?userId=`
 *
 * ⚠️ **목록에 있는 `codeSeq`·`codeName`·`createDt` 가 없다**(OQ-8) — 상세에서 권한·등록일을
 * 보여줄 수 없다. 목록에서 넘겨받아 채우지 않는다(주소로 바로 들어오면 없는 값이 된다).
 */
export interface UserDetail {
  userSeq: number
  loginId: string
  userName: string
  /** 하이픈 없음(`01012345678`) */
  phone: string
  siteSeq: number
  siteName: string
  workYn: boolean
  /** `'0'` — 문자열, 의미 불명(OQ-6) */
  deviceType: string
  /** ⚠️ 토큰 값이 아니라 **보유 여부** */
  fcmToken: boolean
  voipToken: boolean
  /** 절대 URL(`/UploadedFiles/users/...`). 본 spec 은 쓰지 않는다(B-40) */
  imagePath: string | null
  imageName: string | null
  imageExt: string | null
}

/**
 * `UserList` 요청 파라미터 — 🔴 **서버 이름 그대로**다. 사업장은 `siteSeq` 가 아니라
 * **`siteId`** 다(B-12 — 다른 API 와 이름이 다르다). 우리 쪽 이름으로 바꾸면 조용히 무시된다.
 */
export interface UserListParams {
  siteId: number
  /** ⚠️ 검색 대상 미실측(OQ-038-A) */
  searchKey?: string
  codeSeq?: number
  workYn?: boolean
  pageNumber: number
  pageSize: number
}
