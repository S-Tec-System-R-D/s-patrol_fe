import { http, HttpResponse } from 'msw'
import { LOGIN_CODE } from '@/types/api'
import { REFRESH_PATH } from '@/lib/axios'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
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
  '222222': { code: LOGIN_CODE.WORKER, jwtRole: 'Worker', userName: '김근무' },
}

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
          userName: account.userName,
          [MS_ROLE_CLAIM]: account.jwtRole,
        }),
        refreshToken: `mock-refresh-${account.jwtRole}`,
      },
      code: account.code,
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
