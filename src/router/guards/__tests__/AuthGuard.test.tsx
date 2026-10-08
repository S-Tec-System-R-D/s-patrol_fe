import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { server } from '@/mocks/server'
import AuthGuard from '../AuthGuard'
import { setAccessToken, clearTokens } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { makeAccessToken } from '@/test/jwt'

// 020: 사용자 정보의 출처가 JWT 클레임이다. 토큰을 심는 것이 곧 로그인 상태다.
const FIELD_TOKEN = makeAccessToken({ userName: 'tester' })

const renderAt = (initialPath: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/*" element={<AuthGuard />}>
            {/* 부모가 `/admin/*`이므로 자식은 **상대 경로**여야 한다. 021 이전에는
                `admin/locations`(= /admin/admin/locations)로 잘못 중첩돼 있었는데,
                본사 통과 케이스를 검사하는 테스트가 없어 드러나지 않았다. */}
            <Route path="locations" element={<div>OUTLET_OK</div>} />
          </Route>
          <Route path="/*" element={<AuthGuard />}>
            <Route path="zones" element={<div>OUTLET_OK</div>} />
          </Route>
          <Route path="/login" element={<div>SERVICE_LOGIN</div>} />
          <Route path="/admin/login" element={<div>ADMIN_LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('토큰 없음 → /login 으로 Navigate', async () => {
    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
  })

  it('토큰 없음 + admin 영역 → /admin/login 으로 Navigate', async () => {
    renderAt('/admin/locations')
    await waitFor(() => expect(screen.getByText('ADMIN_LOGIN')).toBeInTheDocument())
  })

  it('유효한 토큰 + 사업장 선택됨 → Outlet 렌더(하위 라우트 통과)', async () => {
    setAccessToken(FIELD_TOKEN)
    setSite(7, '강동 테크노타워')

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('OUTLET_OK')).toBeInTheDocument())
  })

  /**
   * 🔴 021: "토큰 있음 + siteSeq 없음"은 로그인 도중 **반드시 생기는** 중간 상태다 —
   * `UserSiteSelect`가 `sign` 엔드포인트라 토큰을 먼저 저장해야 호출되기 때문이다.
   * 그 상태로 새로고침하면 여기서 막지 않는 한 홈이 siteSeq 없이 조회를 날리고,
   * 그 응답은 403이 아니라 200 + 빈 목록이라(api-spec.md:211) 조용히 틀린 화면이 된다.
   */
  it('토큰은 있지만 사업장 미선택 → 로그인으로 Navigate', async () => {
    setAccessToken(FIELD_TOKEN)

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
  })

  /**
   * 🔴 본사는 사업장 선택 단계가 없다(siteSeq 소비처 0개, Phase 5).
   * 여기에 siteSeq를 요구하면 본사 로그인이 그 자리에서 막힌다.
   */
  it('본사 영역은 사업장 미선택이어도 통과한다', async () => {
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'SystemManager' }))

    renderAt('/admin/locations')
    await waitFor(() => expect(screen.getByText('OUTLET_OK')).toBeInTheDocument())
  })

  // 020: 디코딩 불가한 토큰은 "사용자를 특정할 수 없음" → 가드가 로그인으로 보낸다.
  // 019까지는 /api/auth/me의 401이 이 경로를 만들었다.
  it('손상된 토큰 → 로그인으로 Navigate', async () => {
    setAccessToken('not-a-jwt')

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
  })

  // 토큰 자체는 멀쩡한데 role 문자열이 미실측 값인 경우(OQ-D). 권한을 특정할 수 없으므로
  // 통과시키지 않는다 — spec 020 §3 규칙 6.
  // 🔴 예시를 `'Master'` → `'Manager'` 로 바꿨다. Master 는 022 Phase 8 R1 에서 실측되어
  // 매핑에 들어갔고, code 103(Manager) 계정이 없어 그쪽이 미실측으로 남았다.
  it('매핑에 없는 role 클레임 → 로그인으로 Navigate', async () => {
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'Manager' }))

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
  })
})
