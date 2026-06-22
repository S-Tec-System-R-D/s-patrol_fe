import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import AuthGuard from '../AuthGuard'
import { setAccessToken, clearTokens } from '@/lib/auth/tokens'
import type { MeRaw } from '@/features/auth/types/me'
import type { ApiResponse } from '@/types/api'

const ok = <T,>(data: T): ApiResponse<T> => ({ code: 200, message: '성공', data })

const ME: MeRaw = {
  id: 'u1',
  name: 'tester',
  phone: '010-0000-0000',
  role: 'FIELD_MANAGER',
  status: 'ACTIVE',
  registeredAt: '2026-01-01T00:00:00.000Z',
}

// AppLayout이 Sidebar/TopNav를 그리지만 본 테스트에서 본문 렌더만 확인하므로 mock
vi.mock('@/components/layout', () => ({
  AppLayout: () => <div>APP_LAYOUT</div>,
}))

const renderAt = (initialPath: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/*" element={<AuthGuard />} />
          <Route path="/*" element={<AuthGuard />} />
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

  it('토큰 있음 + useMe 200 → AppLayout 렌더', async () => {
    setAccessToken('mock-token')
    server.use(http.get('/api/auth/me', () => HttpResponse.json(ok(ME))))

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('APP_LAYOUT')).toBeInTheDocument())
  })

  it('토큰 있음 + useMe 401(refresh도 실패) → 로그인으로 Navigate', async () => {
    setAccessToken('mock-token')
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ code: 401, message: '인증 필요', data: null }, { status: 401 })
      ),
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ code: 401, message: '재발급 실패', data: null }, { status: 401 })
      )
    )

    renderAt('/zones')
    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
  })
})
