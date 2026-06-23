import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { ProfileBadge } from '../ProfileBadge'
import { setAccessToken, clearTokens, getAccessToken } from '@/lib/auth/tokens'
import type { MeRaw } from '@/features/auth/types/me'
import type { ApiResponse } from '@/types/api'

const ok = <T,>(data: T): ApiResponse<T> => ({ code: 200, message: '성공', data })

const ME: MeRaw = {
  id: 'u1',
  name: '홍길동',
  phone: '010-0000-0000',
  role: 'FIELD_MANAGER',
  status: 'ACTIVE',
  registeredAt: '2026-01-01T00:00:00.000Z',
}

const renderAt = (initialPath: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/*" element={<ProfileBadge />} />
          <Route path="/login" element={<div>SERVICE_LOGIN</div>} />
          <Route path="/admin/login" element={<div>ADMIN_LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProfileBadge', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('로그인 사용자명이 드롭다운 라벨에 노출', async () => {
    setAccessToken('mock-token')
    server.use(http.get('/api/auth/me', () => HttpResponse.json(ok(ME))))

    renderAt('/zones')
    const trigger = await screen.findByLabelText('프로필 메뉴 열기')
    await userEvent.click(trigger)

    await waitFor(() => expect(screen.getByText('홍길동')).toBeInTheDocument())
    expect(screen.getByText('로그아웃')).toBeInTheDocument()
  })

  it('로그아웃 클릭 시 토큰 clear + 로그인 페이지로 이동', async () => {
    setAccessToken('mock-token')
    server.use(http.get('/api/auth/me', () => HttpResponse.json(ok(ME))))

    renderAt('/zones')
    const trigger = await screen.findByLabelText('프로필 메뉴 열기')
    await userEvent.click(trigger)

    const logoutItem = await screen.findByText('로그아웃')
    await userEvent.click(logoutItem)

    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
  })

  it('admin 영역에서 로그아웃 시 /admin/login으로 이동', async () => {
    setAccessToken('mock-token')
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(ok({ ...ME, role: 'SYSTEM' })))
    )

    renderAt('/admin/locations')
    const trigger = await screen.findByLabelText('프로필 메뉴 열기')
    await userEvent.click(trigger)

    const logoutItem = await screen.findByText('로그아웃')
    await userEvent.click(logoutItem)

    await waitFor(() => expect(screen.getByText('ADMIN_LOGIN')).toBeInTheDocument())
  })
})
