import { http, HttpResponse } from 'msw'
import type { ApiResponse } from '@/types/api'
import type { MeRaw } from '@/features/auth/types/me'
import type { Role } from '@/types/enum'
import { DEV_ROLE_KEY } from '@/lib/auth/tokens'

/**
 * MSW 인증 핸들러.
 * - 003 인증 인프라가 즉시 의존: `/api/auth/me`, `/api/auth/refresh`.
 * - default role: `FIELD_MANAGER` (현장이 1차 타겟. spec.md Open Q 추천).
 * - 임시 진입 버튼 흐름: `localStorage['dev.role']`을 읽어 role/소속 필드를 동적으로 스왑.
 *   Phase 3 실 로그인 폼 도입 시 스왑 로직·`DEV_ROLE_KEY` 함께 제거.
 * - 토큰 값은 의미 없는 placeholder 문자열. 실 백엔드 연동 시 교체.
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
  http.get('/api/auth/me', () => HttpResponse.json(ok(buildMockMe(readDevRole())))),

  http.post('/api/auth/refresh', () =>
    HttpResponse.json(
      ok({
        accessToken: `mock-access-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
      })
    )
  ),
]
