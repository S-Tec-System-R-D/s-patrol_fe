import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { server } from '@/mocks/server'
import AuthGuard from '../AuthGuard'
import { setAccessToken, clearTokens } from '@/lib/auth/tokens'
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
            <Route path="admin/locations" element={<div>OUTLET_OK</div>} />
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

  it('유효한 토큰 → Outlet 렌더(하위 라우트 통과)', async () => {
    setAccessToken(FIELD_TOKEN)

    renderAt('/zones')
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
  // 통과시키지 않는다 — spec 020 §3 규칙 6. Master·Manager 계정이 생기면 이 경로가 사라진다.
  it('매핑에 없는 role 클레임 → 로그인으로 Navigate', async () => {
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'Master' }))

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
  })
})
