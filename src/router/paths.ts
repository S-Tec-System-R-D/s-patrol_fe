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
const noticeDetail = (id: string) => `/notice/${id}`
/** 🔴 `pointSeq` 는 number 다(`CLAUDE.md` B4 "ID는 number") — 공지의 `id: string` 과 다르다 */
const pointDetail = (pointSeq: number) => `/points/${pointSeq}`

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
    patrolPoints: '/patrol/points',
    zones: '/zones',
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
  noticeDetail: '/notice/:id',
  pointDetail: '/points/:pointSeq',
} as const

/**
 * 영역 판별 — 인터셉터·redirect 등 라우터 외부 컨텍스트에서 사용.
 * `/admin`으로 시작하면 본사 영역.
 */
export const isAdminArea = (pathname: string): boolean =>
  pathname.startsWith('/admin')
