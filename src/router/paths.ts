/**
 * 라우트 경로 SSOT.
 * - 사용처: 라우트 정의, `redirect.ts`, 네비게이션 링크, 테스트.
 * - 동적 세그먼트는 **두 가지 형태**를 함께 둔다.
 *   - 함수 형태(`adminLocationDetail(id)`): 코드에서 실제 경로 문자열 만들 때.
 *   - 패턴 상수(`adminLocationDetailPattern`): `<Route path={...}>` 정의용.
 * - 영역 분기(/admin/* vs /*)는 본 파일의 `paths.admin.*` / `paths.service.*` 그룹으로 판단.
 *
 * docs/screens.md §4 라우트 매핑과 1:1 정렬.
 */

const adminLocationDetail = (id: string) => `/admin/locations/${id}`
/** 🔴 `noticeSeq` 는 number 다(`spec 026` — mock 시절 `id: string` 에서 서버 키로 전환) */
const noticeDetail = (noticeSeq: number) => `/notice/${noticeSeq}`
/** 🔴 `pointSeq` 는 number 다(`CLAUDE.md` B4 "ID는 number") */
const pointDetail = (pointSeq: number) => `/points/${pointSeq}`
/** 🔴 `courseSeq` 도 number 다 — `pointDetail` 과 같은 모양으로 둔다(새 관례를 만들지 않는다) */
const courseDetail = (courseSeq: number) => `/zones/${courseSeq}`
/**
 * 코스 **순찰 회차** 상세 (`spec 036`).
 *
 * 🔴 **`courseDetail` 과 다른 것이다.** 앞에 `/patrol` 이 붙고 키가 **`historySeq`(회차)**
 * 다 — `/zones/:courseSeq` 는 "그 코스의 현재 편성"(코스 관리), 이쪽은 "그 코스를 언제
 * 어떻게 돌았는지"(순찰이력)다. 같은 코스가 회차마다 다른 결과를 갖는다.
 */
const patrolZoneDetail = (historySeq: number) => `/patrol/zones/${historySeq}`
/**
 * 지점 **인증 1건** 상세 (`spec 037`).
 *
 * 🔴 **`pointDetail` 과 다른 것이다.** 앞에 `/patrol` 이 붙고 키가 **`detailSeq`(인증 1건)**
 * 다 — `/points/:pointSeq` 는 "그 지점 자체"(지점 관리), 이쪽은 "그 지점을 언제 어떻게
 * 인증했는지"다. 같은 지점이 하루에 여러 번 찍히고 **회차마다 결과가 다르다.**
 */
const patrolPointDetail = (detailSeq: number) => `/patrol/points/${detailSeq}`

export const paths = {
  // 공개 영역
  landing: '/',
  serviceLogin: '/login',
  adminLogin: '/admin/login',

  // 에러 상태 (005 결정: 401 별도 페이지 없음 — 인터셉터 refresh→실패 시 로그인 리다이렉트로 흡수)
  forbidden: '/403',
  notFound: '/404',

  // 현장 사이트(/*)
  service: {
    patrolZones: '/patrol/zones',
    patrolZoneDetail: patrolZoneDetail,
    patrolPoints: '/patrol/points',
    patrolPointDetail: patrolPointDetail,
    zones: '/zones',
    courseDetail: courseDetail,
    points: '/points',
    pointDetail: pointDetail,
    users: '/users',
    deployments: '/deployments',
    notice: '/notice',
    noticeDetail: noticeDetail,
    settingsKeywords: '/settings/keywords',
  },

  // 본사 사이트(/admin/*)
  admin: {
    locations: '/admin/locations',
    locationDetail: adminLocationDetail,
    admins: '/admin/admins',
  },
} as const

/**
 * `<Route path={...}>` 정의용 패턴 상수.
 * react-router는 `:id` 같은 동적 세그먼트 표기를 사용한다.
 */
export const pathPatterns = {
  adminLocationDetail: '/admin/locations/:id',
  noticeDetail: '/notice/:noticeSeq',
  pointDetail: '/points/:pointSeq',
  courseDetail: '/zones/:courseSeq',
  patrolZoneDetail: '/patrol/zones/:historySeq',
  patrolPointDetail: '/patrol/points/:detailSeq',
} as const

/**
 * 영역 판별 — 인터셉터·redirect 등 라우터 외부 컨텍스트에서 사용.
 * `/admin`으로 시작하면 본사 영역.
 */
export const isAdminArea = (pathname: string): boolean =>
  pathname.startsWith('/admin')
