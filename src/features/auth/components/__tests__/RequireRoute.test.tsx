import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { REFRESH_PATH } from '@/lib/axios'
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { RequireRoute } from '../RequireRoute'
import type { MeRaw } from '@/features/auth/types/me'
import type { ApiResponse } from '@/types/api'

const ok = <T,>(data: T): ApiResponse<T> => ({ code: 200, message: '성공', data })

const ADMIN_ME: MeRaw = {
  id: 'admin-1',
  name: 'admin',
  phone: '010-0000-0000',
  role: 'SYSTEM',
  status: 'ACTIVE',
  registeredAt: '2026-01-01T00:00:00.000Z',
}

const FIELD_ME: MeRaw = {
  ...ADMIN_ME,
  id: 'field-1',
  role: 'FIELD_MANAGER',
}

const renderWithRouter = (initialPath: string, ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/*" element={ui} />
          <Route path="/403" element={<div>FORBIDDEN_PAGE</div>} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RequireRoute', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('role 일치 시 children 렌더', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(ok(ADMIN_ME))))

    renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    await waitFor(() => expect(screen.getByText('PROTECTED')).toBeInTheDocument())
  })

  it('role 불일치 시 /403으로 리다이렉트', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json(ok(FIELD_ME))))

    renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    await waitFor(() => expect(screen.getByText('FORBIDDEN_PAGE')).toBeInTheDocument())
    expect(screen.queryByText('PROTECTED')).not.toBeInTheDocument()
  })

  it('미인증(useMe 실패) 시 /login으로 리다이렉트', async () => {
    // refreshToken이 없으면 재발급을 건너뛰어 아래 재발급 핸들러가 걸리지 않는다
    setAccessToken('mock-token')
    setRefreshToken('mock-refresh')
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json({ code: 401, message: '인증 필요', data: null }, { status: 401 })),
      // refresh도 실패시켜 인터셉터의 재시도가 막히도록
      // 경로는 axios의 REFRESH_PATH를 그대로 참조한다 — 하드코딩하면 조용히 어긋나 이 핸들러가 안 걸린다
      http.post(REFRESH_PATH, () => HttpResponse.json({ code: 401, message: '재발급 실패', data: null }, { status: 401 }))
    )

    renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    await waitFor(() => expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument())
  })

  it('로딩 중에는 children 렌더 안 함(빈 화면)', () => {
    // 응답을 지연시켜 로딩 상태 유지
    server.use(
      http.get('/api/auth/me', async () => {
        await new Promise((r) => setTimeout(r, 1000))
        return HttpResponse.json(ok(ADMIN_ME))
      })
    )

    const { container } = renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    expect(container.textContent).not.toContain('PROTECTED')
    expect(container.textContent).not.toContain('FORBIDDEN_PAGE')
  })
})
