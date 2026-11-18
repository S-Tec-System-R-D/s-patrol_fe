/**
 * 시뮬레이터가 읽는 응답 타입 (`spec 082`).
 * 앱 API 는 `docs/app-api-spec.md` §6 실측 그대로 전량 선언한다(`CLAUDE.md` B4).
 */

/** 사업장 선택 목록의 한 줄 — 본사 `AdminSiteSelect` 트리를 편 것 */
export interface SimSite {
  siteSeq: number
  siteName: string
  /** 소속 그룹 경로 — `에스텍시스템 / 시스템개발연구소 / 본부직할` */
  groupPath: string
  /** 하위 사업장이면 모 사업장 이름 */
  parentSiteName: string | null
}

/** 웹 `GET User/W/sign/UserList` 행 (실측 2026-11-18) */
export interface SimSiteUser {
  userSeq: number
  userName: string
  loginId: string
  /** 6 현장 관리자 · 7 현장 근무자 */
  codeSeq: number
  codeName: string
  /** 🔴 **다른 사업장에서 배치돼 온 근무자만** 값이 있다(원 소속 번호). 이 사업장 소속이면 `null` */
  originSiteSeq: number | null
  /** 원 소속 사업장 이름 — 이 사업장 소속이면 이 사업장 이름이 온다 */
  originSiteName: string | null
  workYn: boolean
  createDt: string
}

/** 웹 `GET Point/W/sign/GetPointList` 행 (실측 2026-11-18) */
export interface SimPoint {
  pointSeq: number
  pointName: string
  memo: string | null
  /** 9 QR · 10 NFC */
  authMethod: number
  authMethodName: string
  usedCount: number
  useYn: boolean
  /** NFC 인데 `null` 인 지점이 있다 — 인증할 값이 없어 순찰에서 건너뛸 수밖에 없다 */
  nfcTagId: string | null
  lastPatrolDt: string | null
}

/** 웹 `GET Course/W/sign/GetCourseList` 행 (실측 2026-11-18) */
export interface SimCourse {
  courseSeq: number
  courseName: string
  useYn: boolean
  /** 교대 허용 */
  switchYn: boolean
  totalMin: number
  /** 0 대기중 · 1 순찰중 · 2 교대중 */
  courseStatusCode: number
  courseStatusName: string
  pointCount: number
  /** 마지막 회차 요약 — 시뮬레이터는 쓰지 않는다 */
  history: unknown
}

/** 웹 `GET Course/W/sign/GetCourseDetail` 의 지점 줄 (실측 2026-11-18) */
export interface SimCoursePoint {
  coursePointSeq: number
  pointSeq: number
  gpsLat: number | null
  gpsLng: number | null
  pointName: string
  /** 9 QR · 10 NFC */
  authMethod: number
  orderNo: number
  useYn: boolean
  /** 이 지점의 제한 시간(분) — 넘겨 인증하면 시간초과 */
  courseMin: number
}

/** 웹 `GET Course/W/sign/GetCourseDetail` (실측 2026-11-18) */
export interface SimCourseDetail {
  courseSeq: number
  courseName: string
  memo: string | null
  useYn: boolean
  switchYn: boolean
  totalMin: number
  points: SimCoursePoint[]
}

/** 앱 `GET Point/M/sign/DetailPoint` — 인증값이 여기 있다 */
export interface AppPointDetail {
  pointSeq: number
  name: string
  memo: string | null
  authMethod: number
  authMethodName: string
  /** `STSP1:{사업장}:{지점}:{시각}:{서명}` — QR 인증에 **전체 문자열**을 보낸다. NFC 지점은 `null` */
  qrCode: string | null
  nfcTagId: string | null
  gpsLat: number | null
  gpsLng: number | null
  useYn: boolean
  lastPatrolDt: string | null
  lastPatrolUserSeq: number | null
  lastPatrolUserName: string | null
  courseList: { courseSeq: number; courseName: string }[]
}

/**
 * 앱 `GET User/M/sign/DetailUser` 의 배치 정보 (실측 2026-11-18 — 신청 → 승인 → 복귀 전 단계).
 * 배치와 무관한 근무자는 `affiliation` 자체가 `null` 이다(복귀가 끝나도 `null` 로 돌아온다).
 */
export interface UserAffiliation {
  assignmentSeq: number
  /** 🔴 이름과 달리 **배치돼 가는(간) 사업장**이다 — 원 소속은 `AppUserDetail.siteSeq` */
  affiliationSiteSeq: number
  affiliationSiteName: string
  assignmentType: string
  /** 0 승인 대기 · 1 승인됨(배치 중) · 2 거절됨 */
  assignApprovalStatus: number
  reason: string | null
  startDt: string
  endDt: string | null
  /** 0 복귀 신청 없음 · 1 복귀 승인 대기 · 3 복귀 거절됨 (2 는 나오지 않는다 — 승인되면 `affiliation` 이 `null` 이 된다) */
  returnApprovalStatus: number
}

/** 앱 `GET User/M/sign/DetailUser` — 근무자 본인 토큰으로도 읽힌다 */
export interface AppUserDetail {
  userSeq: number
  codeSeq: number
  codeName: string
  /** 원 소속 사업장 — 배치 중에도 바뀌지 않는다 */
  siteSeq: number
  siteName: string
  loginId: string
  userName: string
  phoneNumber: string
  image: string | null
  imageName: string | null
  workYn: boolean
  affiliation: UserAffiliation | null
}

/** 앱 `GET User/M/sign/GetTodayPatrolCount` */
export interface TodayPatrolCount {
  workYn: boolean
  patrolCount: number
}

/** 앱 진행 중 회차의 지점 줄 메모 */
export interface PatrolMemo {
  memoSeq: number
  memo: string
  attachList: unknown[]
}

/** 앱 `GetMyActivePatrol` · `GetStartPatrolInfo` 의 지점 줄 */
export interface ActivePatrolDetail {
  detailSeq: number
  coursePointSeq: number
  pointSeq: number
  pointName: string
  pointMemo: string | null
  /** 9 QR · 10 NFC */
  authMethod: number
  courseMin: number
  orderNo: number
  /** 0 아직 차례 아님 · 1 지금 차례 · 3 미완료(건너뜀 · 도중 종료) · 4 완료 */
  detailStatus: number
  checkUserSeq: number | null
  checkUserName: string | null
  overtimeYn: boolean
  checkDt: string | null
  memoList: PatrolMemo[]
}

/** 앱 `GET UserPatrol/M/sign/GetMyActivePatrol` — 진행 중인 순찰이 없으면 `null` */
export interface ActivePatrol {
  historySeq: number
  startDt: string
  endDt: string | null
  pauseStartDt: string | null
  /** 🔴 진행 중 회차에서는 **초(정수)** 다(이력에서는 `"HH:mm:ss"`) */
  pauseTime: number
  courseName: string
  courseMemo: string | null
  totalMin: number
  startUserSeq: number
  startUserName: string
  switchYn: boolean
  /** 1 순찰 중 · 2 교대 요청 중 · 0 종료됨 */
  patrolStatus: number
  prevUserSeq: number | null
  prevUserName: string | null
  details: ActivePatrolDetail[]
}
