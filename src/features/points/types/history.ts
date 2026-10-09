/**
 * 지점 순찰이력 — `GET /api/v1/History/W/sign/GetPointHistory`
 *
 * 🔴 **응답은 실측돼 있다**(`api-spec.md` §5-2 19번). 지점 상세의 "순찰 인증 기록"
 * 섹션이 이것을 쓴다(`spec 027` Phase 3).
 *
 * 실측 그대로 **전량 선언**한다 — 지금 쓰지 않는 필드도 둔다(`CLAUDE.md` B4).
 */
export interface PointHistoryRow {
  detailSeq: number
  courseSeq: number
  courseName: string
  pointSeq: number
  pointName: string
  /** ISO 8601, 타임존 없음 */
  checkDt: string
  userSeq: number
  userName: string
  authMethod: number | null
  /** 🔴 null 일 때 `''`(빈 문자열) — B-6 */
  authMethodName: string
  /** 3=미완료 4=완료 (🔴 코스이력은 1·2로 체계가 다르다 — B-7) */
  status: number
  statusName: string
  /** 🔴 여기는 대문자 T (`overTimeYn`) — 엔드포인트마다 뒤섞인다, B-4 */
  overTimeYn: boolean
  hasMemo: boolean
  /** 'HH:mm:ss' */
  pauseTime: string
}

/**
 * `GetPointHistory` 쿼리 파라미터.
 *
 * swagger 실측: `siteSeq`·`fromDt`·`toDt`·`courseSeq`·`pointSeq`·`authMethod`·
 * `userSeq`·`status`·`courseName`·`userName`·`pageNumber`·`pageSize`
 *
 * 027 은 **지점 상세용**이라 `siteSeq` + `pointSeq` + 기간 + 페이징만 쓴다.
 * 나머지는 `spec 024`(지점 순찰이력 화면)가 쓴다 — 지금 선언하면 안 쓰는 필드가 는다(A6).
 */
export interface PointHistoryParams {
  siteSeq: number
  pointSeq: number
  /** 'yyyy-MM-dd' */
  fromDt: string
  toDt: string
  pageNumber: number
  pageSize: number
}
