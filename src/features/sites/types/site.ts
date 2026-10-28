/**
 * 본사 사업장 도메인 타입 (`spec 044` T778).
 * 출처: `api-spec.md` §5-1-B "사업장 3종"(실측 2026-10-23) · §5-2 7번.
 *
 * 목록 노드(`GroupListNode`·`GroupListSite`)는 045 도 쓰므로 `features/groups/types/group.ts` 에 있다.
 */

/** 헬스체크 예외 시간 1행 — 시각은 `'HH:mm:ss'` */
export interface ExceptionTime {
  detailSeq: number
  exceptionStartTime: string
  exceptionEndTime: string
}

/**
 * `GET Site/W/sign/GetSiteDetail?siteSeq` — 본사 전용.
 *
 * 🔴 **소속 그룹 · 모 사업장이 없다** — `GetGroupList` 에서 그 사업장 노드를 찾아 읽는다.
 * 🔴 최소 바디로 만든 사업장은 `Interval 0 · Timeout 0 · Retry null · Start/End null` 이다(실측).
 * 헬스체크를 꺼도 값은 남는다(`UpdateSite` 가 유지한다).
 */
export interface SiteDetail {
  siteSeq: number
  siteName: string
  tel: string | null
  address: string | null
  healthCheckYn: boolean
  /** 체크 주기(분) */
  healthCheckInterval: number
  /** 단위 미확인(OQ-044-B) */
  healthCheckTimeout: number
  healthCheckRetry: number | null
  healthCheckStartTime: string | null
  healthCheckEndTime: string | null
  exceptionTime: ExceptionTime[]
  userCount: number
  courseCount: number
  pointCount: number
}

/**
 * `POST Site/W/sign/AddSite` — 성공 `data: true`, 🔴 **새 `siteSeq` 를 주지 않는다.**
 *
 * 화면은 이 5개만 보낸다. 🔴 swagger 의 헬스체크 · `exceptionTime` 은 싣지 않는다 — `exceptionTime` 은 보내도
 * **버린다**(B-52). 헬스체크는 상세에서 `UpdateSite` 로 켠다.
 */
export interface AddSiteRequest {
  /** 🔴 서버는 단계를 검사하지 않는다 — 지사만 고르게 하는 것은 화면 몫(OQ-043-E) */
  groupSeq: number
  siteName: string
  address: string
  /** 빈 값이면 싣지 않는다(생략 = `null`) */
  tel?: string
  /**
   * 모 사업장 — 생략 = 최상위. 🔴 **같은 그룹의 사업장만**(아니면 400) · 만든 뒤 바꿀 수 없다(`UpdateSite` 에 없음).
   * 화면은 그 지사의 최상위 사업장만 후보로 준다(`spec 051`).
   */
  parentSiteSeq?: number
}

/** `UpdateSite` 의 예외 시간 1행 — 🔴 `detailSeq: 0` = 새 행, 기존 값 = 그 행 수정 */
export interface UpdateExceptionTime {
  detailSeq: number
  exceptionStartTime: string
  exceptionEndTime: string
}

/**
 * `PUT Site/W/sign/UpdateSite` — 🔴 **PUT 이지만 부분 갱신이다**(실측).
 *
 * - 생략 · `null` = 유지. `tel` · `address` 는 **`""` 를 보내야 지워진다.**
 * - `groupSeq` 변경 = 이동 — 하위 사업장도 함께 옮겨진다. 하위 사업장 자신은 400.
 * - 🔴 `exceptionTime` 은 **보낸 목록으로 통째로 교체**된다 — 빠진 기존 행은 지워진다. 생략하면 유지, `[]` 면 전부 삭제.
 * - `healthCheckYn: true` 면 저장된 값까지 합쳐 필수 5개를 검사한다. 누락은 (D) 문자열 body 로 온다.
 */
export interface UpdateSiteRequest {
  siteSeq: number
  groupSeq?: number
  siteName?: string
  tel?: string
  address?: string
  healthCheckYn?: boolean
  healthCheckInterval?: number
  healthCheckTimeout?: number
  healthCheckRetry?: number
  /** `'HH:mm:ss'` — 🔴 24시간 이상은 일 단위로 저장된다(B-53). 화면은 시각 입력으로만 받는다 */
  healthCheckStartTime?: string
  healthCheckEndTime?: string
  exceptionTime?: UpdateExceptionTime[]
}

/**
 * `GET Site/W/sign/GetSiteManagerList?siteSeq` 행 (`spec 057`) — 실측 2026-10-27(`api-spec.md` §5-1-C).
 * 🔴 연락처 · 사번 없음. 없는 사업장 400 "사업장이 존재하지 않습니다."
 */
export interface SiteManager {
  userSeq: number
  codeSeq: number
  codeName: string
  userName: string
}
