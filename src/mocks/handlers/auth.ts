import { http, HttpResponse } from 'msw'
import type { ApiResponse } from '@/types/api'
import type { MeRaw } from '@/features/auth/types/me'

/**
 * MSW 인증 핸들러.
 * - 003 인증 인프라가 즉시 의존: `/api/auth/me`, `/api/auth/refresh`.
 * - default role: `FIELD_MANAGER` (현장이 1차 타겟. spec.md Open Q 추천).
 * - 토큰 값은 의미 없는 placeholder 문자열. 실 백엔드 연동 시 교체.
 */

const MOCK_ME: MeRaw = {
  id: 'mock-user-001',
  name: '홍길동',
  phone: '010-0000-0000',
  role: 'FIELD_MANAGER',
  locationId: 'loc-mock-001',
  locationName: '강동 그랜드타워',
  status: 'ACTIVE',
  registeredAt: '2026-01-01T00:00:00.000Z',
}

const ok = <T>(data: T): ApiResponse<T> => ({ code: 200, message: '성공', data })

export const authHandlers = [
  http.get('/api/auth/me', () => HttpResponse.json(ok(MOCK_ME))),

  http.post('/api/auth/refresh', () =>
    HttpResponse.json(
      ok({
        accessToken: `mock-access-${Date.now()}`,
        refreshToken: `mock-refresh-${Date.now()}`,
      })
    )
  ),
]
