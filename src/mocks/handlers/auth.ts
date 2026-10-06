import { http, HttpResponse } from 'msw'
import type { ApiResponse } from '@/types/api'
import type { MeRaw } from '@/features/auth/types/me'
import type { Role } from '@/types/enum'
import { DEV_ROLE_KEY } from '@/lib/auth/tokens'
import { REFRESH_PATH } from '@/lib/axios'

/**
 * MSW 인증 핸들러.
 * - default role: `FIELD_MANAGER` (현장이 1차 타겟. spec.md Open Q 추천).
 * - 임시 진입 버튼 흐름: `localStorage['dev.role']`을 읽어 role/소속 필드를 동적으로 스왑.
 *   Phase 3 실 로그인 폼 도입 시 스왑 로직·`DEV_ROLE_KEY` 함께 제거.
 * - 토큰 값은 의미 없는 placeholder 문자열. 실 백엔드 연동 시 교체.
 *
 * 🔴 `/api/auth/me`는 **실재하지 않는 엔드포인트**다(019 실측 — 백엔드에 본인 정보 조회가 없다.
 * `accessToken` JWT 클레임 디코딩으로 대체한다). 핸들러를 지금 지우면 `useMe` 소비처 12곳이
 * 전부 실패하고 `AuthGuard`가 로그인으로 보내 dev 환경 진입이 불가능해지므로,
 * **`useMe`의 JWT 전환(spec 020)과 같은 작업으로 함께 제거한다.** 그때 `DEV_ROLE_KEY`
 * 스왑 로직도 같이 사라진다.
 */

const VALID_ROLES: readonly Role[] = [
  'SYSTEM',
  'MASTER',
  'MANAGER',
  'FIELD_MANAGER',
  'WORKER',
]

const readDevRole = (): Role => {
  try {
    const raw = localStorage.getItem(DEV_ROLE_KEY)
    return (VALID_ROLES as readonly string[]).includes(raw ?? '')
      ? (raw as Role)
      : 'FIELD_MANAGER'
  } catch {
    return 'FIELD_MANAGER'
  }
}

const buildMockMe = (role: Role): MeRaw => {
  const isAdmin = role === 'SYSTEM' || role === 'MASTER' || role === 'MANAGER'
  return {
    id: 'mock-user-001',
    name: '홍길동',
    phone: '010-0000-0000',
    role,
    ...(isAdmin
      ? { groupId: 'grp-mock-001', groupName: '본사 · 서울권역', groupPath: '본사/서울권역' }
      : { locationId: 'loc-mock-001', locationName: '강동 그랜드타워' }),
    status: 'ACTIVE',
    registeredAt: '2026-01-01T00:00:00.000Z',
  }
}

const ok = <T>(data: T): ApiResponse<T> => ({ code: 200, message: '성공', data })

export const authHandlers = [
  // 🔴 제거 예정 — 위 주석 참조(spec 020에서 useMe JWT 전환과 동시)
  http.get('/api/auth/me', () => HttpResponse.json(ok(buildMockMe(readDevRole())))),

  // 재발급 성공 code는 200이 아니라 **201**이다(api-spec.md §2-1 실측).
  // refreshToken은 회전하지 않으므로 요청받은 값을 그대로 돌려준다(§1-3).
  http.post(REFRESH_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { refreshToken?: string } | null
    return HttpResponse.json({
      code: 201,
      message: '요청을 정상 처리하였습니다.',
      data: {
        accessToken: `mock-access-${Date.now()}`,
        refreshToken: body?.refreshToken ?? 'mock-refresh-fixed',
      },
    })
  }),
]
