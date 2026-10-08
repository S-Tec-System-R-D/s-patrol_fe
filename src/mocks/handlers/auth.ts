import { http, HttpResponse } from 'msw'
import { LOGIN_CODE } from '@/types/api'
import { REFRESH_PATH } from '@/lib/axios'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { decodeAccessToken } from '@/lib/auth/jwt'
import { makeAccessToken } from '@/test/jwt'

/**
 * MSW 인증 핸들러.
 *
 * 020에서 전면 교체됐다. 이전에는 `/api/auth/me`(**실재하지 않는 엔드포인트**)가 사용자
 * 정보를 주고 `localStorage['dev.role']`로 역할을 스왑했다. 지금은 실 서버와 같은 구조다 —
 * 로그인이 **JWT를 발급**하고 사용자 정보는 그 클레임에서 나온다.
 *
 * 따라서 mock도 진짜 JWT를 만들어야 한다. `@/test/jwt`의 생성기를 함께 쓴다
 * (둘 다 dev·test 전용이고 MSW는 `VITE_USE_MSW` 조건부 동적 import라 prod 번들에 없다.
 *  테스트가 이미 `@/mocks/server`를 참조하므로 두 영역은 서로 아는 사이다).
 */

/**
 * dev 로그인 계정. **사번으로 권한을 고른다** — `dev.role` 스왑을 대체한다.
 * 사번은 백엔드 테스트 서버의 실측 계정과 맞췄다(`api-spec.md` 수집 정보).
 *
 * Master·Manager 계정이 없는 이유: JWT `role` 문자열이 미실측이다(OQ-D).
 * 추측한 문자열을 넣으면 mock에서는 통과하고 실 서버에서는 막히는, 가장 나쁜 종류의
 * 불일치가 된다. 실측 후 추가한다.
 */
const DEV_ACCOUNTS: Record<string, { code: number; jwtRole: string; userName: string }> = {
  '000000': { code: LOGIN_CODE.SYSTEM, jwtRole: 'SystemManager', userName: '시스템관리자' },
  '333333': { code: LOGIN_CODE.FIELD_MANAGER, jwtRole: 'FieldManager', userName: '홍길동' },
  // 근무자 차단(US3)을 dev에서 직접 눌러보기 위한 계정. 서버는 토큰을 주지만 프론트가 막는다.
  // 🔴 `jwtRole` 을 추측값 `'Worker'` 에서 실측값 `'FieldWorker'` 로 교정했다(Phase 8 R1).
  '222222': { code: LOGIN_CODE.WORKER, jwtRole: 'FieldWorker', userName: '김근무' },
  // Master 권한을 dev에서 눌러보기 위한 본사 계정. `'Master'` 는 **실측값**이다(Phase 8 R1).
  // Manager(code 103)는 해당 계정이 없어 role 문자열이 미실측이라 넣지 않는다 — 추측값을
  // 넣으면 mock 에서는 통과하고 실 서버에서는 막히는 가장 나쁜 불일치가 된다.
  '111111': { code: LOGIN_CODE.MASTER, jwtRole: 'Master', userName: '마스터' },
  // 021 사업장 선택 0/1/N 분기를 dev에서 직접 눌러보기 위한 현장 계정 2종.
  // 권한은 333333과 같고 **소속 사업장 수만 다르다**(아래 DEV_SITES).
  '444444': { code: LOGIN_CODE.FIELD_MANAGER, jwtRole: 'FieldManager', userName: '단일소속' },
  '555555': { code: LOGIN_CODE.FIELD_MANAGER, jwtRole: 'FieldManager', userName: '무소속' },
}

/**
 * ⚠️ **같은 사번의 실 서버 권한과 다르다**(실측 2026-10-08, `spec 022` Phase 8 R1).
 *
 * | 사번 | mock | 실 서버 |
 * |---|---|---|
 * | `000000` | 시스템관리자 101 | **일치** |
 * | `333333` | 현장관리자 201 | **일치** |
 * | `222222` | 근무자 202 | **Master 102** |
 * | `444444`·`555555` | 현장관리자 201 (단일·무소속) | **근무자 202** |
 *
 * 🔴 **일부러 맞추지 않는다.** 이 계정들의 목적은 "dev 에서 분기를 직접 눌러보는 것"이고,
 * 실측에 맞추면 **021 의 사업장 선택 0/1/N 분기를 눌러볼 수단이 사라진다**(444444·555555 가
 * 근무자가 되어 로그인 단계에서 차단된다). 사번이 겹친 것은 020 당시 실측 계정과 맞추려
 * 한 결과이며, 권한까지 같다는 보장은 없었다.
 *
 * ⚠️ 따라서 **mock 로그인 결과로 실 서버 권한을 추측하지 말 것.** 실 서버 확인은
 * `npm run dev:real` 로 한다.
 */

/**
 * 사번별 접근 가능 사업장(`UserSiteSelect`의 `children`).
 *
 * 응답 구조는 `api-spec.md` §5-2 실측 그대로다 — 루트(`siteSeq 6`)는 선택 대상이 아니고
 * `children`의 필드명이 루트와 다르다(`childSiteSeq`).
 */
const DEV_SITES: Record<string, { childSiteSeq: number; childSiteName: string; parentSeq: number }[]> =
  {
    '333333': [
      { childSiteSeq: 7, childSiteName: '강동 테크노타워', parentSeq: 6 },
      { childSiteSeq: 8, childSiteName: '강동 그랜드타워', parentSeq: 6 },
    ],
    '444444': [{ childSiteSeq: 7, childSiteName: '강동 테크노타워', parentSeq: 6 }],
    '555555': [],
  }

/**
 * 사번을 알 수 없을 때의 기본값 — **1개(자동 진입)**.
 *
 * 🔴 폴백이 "1개"인 이유: 테스트 다수가 `server.use`로 로그인 응답만 덮고 accessToken에
 * JWT가 아닌 문자열(`'new-access'`)을 쓴다. 그러면 아래 핸들러가 사번을 디코딩할 수 없다.
 * 폴백이 2개 이상이면 그 테스트들이 전부 선택 단계에서 멈춰, "code가 착지점을 정한다"는
 * 원래 의도(020)가 사업장 선택 테스트로 변질된다. 1개면 자동 진입이라 의도가 보존된다.
 */
const FALLBACK_SITES = [{ childSiteSeq: 7, childSiteName: '강동 테크노타워', parentSeq: 6 }]

const USER_SITE_SELECT_PATH = '/api/v1/Login/W/sign/UserSiteSelect'

export const authHandlers = [
  http.post('/api/v1/Login/W/Login', async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { loginId?: string } | null
    const account = DEV_ACCOUNTS[body?.loginId ?? '']

    if (!account) {
      // 실측 실패 응답 형태 — ApiResponse 래퍼 + HTTP 400(`api-spec.md` §3-(A))
      return HttpResponse.json(
        { message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null, code: 400 },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: '요청을 정상 처리하였습니다.',
      data: {
        accessToken: makeAccessToken({
          // 🔴 `loginId`를 실제 사번으로 심는다. `makeAccessToken`의 기본값이 `'333333'`이라
          // 심지 않으면 모든 계정이 같은 사번으로 디코딩돼 `UserSiteSelect` 분기가 망가진다.
          loginId: body?.loginId ?? '',
          userName: account.userName,
          [MS_ROLE_CLAIM]: account.jwtRole,
        }),
        refreshToken: `mock-refresh-${account.jwtRole}`,
      },
      code: account.code,
    })
  }),

  /**
   * 현장 계정의 접근 가능 사업장(`spec 021`).
   *
   * 서버는 파라미터를 받지 않고 **토큰의 사용자 기준**으로 목록을 정한다. mock도 같은
   * 방식으로 `Authorization` 헤더의 JWT에서 `loginId`를 읽어 분기한다 — 사번으로 dev
   * 계정을 고르는 020의 체계를 그대로 잇는다.
   */
  http.get(USER_SITE_SELECT_PATH, ({ request }) => {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/, '') ?? null
    const loginId = decodeAccessToken(token)?.loginId ?? ''
    const children = loginId in DEV_SITES ? DEV_SITES[loginId] : FALLBACK_SITES

    return HttpResponse.json({
      message: '요청을 정상 처리하였습니다.',
      data: { siteSeq: 6, siteName: '강동지사', children },
      code: 200,
    })
  }),

  // 재발급 성공 code는 200이 아니라 **201**이다(api-spec.md §2-1 실측).
  // refreshToken은 회전하지 않으므로 요청받은 값을 그대로 돌려준다(§1-3).
  // 새 accessToken도 JWT여야 한다 — 재발급 직후 useMe가 그것을 디코딩한다.
  http.post(REFRESH_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { refreshToken?: string } | null
    return HttpResponse.json({
      code: 201,
      message: '요청을 정상 처리하였습니다.',
      data: {
        accessToken: makeAccessToken(),
        refreshToken: body?.refreshToken ?? 'mock-refresh-fixed',
      },
    })
  }),
]
