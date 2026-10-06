import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { server } from '@/mocks/server'
import { ProfileBadge } from '../ProfileBadge'
import { setAccessToken, clearTokens, getAccessToken } from '@/lib/auth/tokens'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { makeAccessToken } from '@/test/jwt'

// 020: 본인 정보가 /api/auth/me(실재하지 않는 엔드포인트)에서 JWT 클레임으로 바뀌었다.
// 사용자를 만드는 방법 = 토큰을 심는 것.
const FIELD_TOKEN = makeAccessToken({ userName: '홍길동' })
const ADMIN_TOKEN = makeAccessToken({
  userName: '홍길동',
  [MS_ROLE_CLAIM]: 'SystemManager',
})

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
    setAccessToken(FIELD_TOKEN)

    renderAt('/zones')
    const trigger = await screen.findByLabelText('프로필 메뉴 열기')
    await userEvent.click(trigger)

    await waitFor(() => expect(screen.getByText('홍길동')).toBeInTheDocument())
    expect(screen.getByText('로그아웃')).toBeInTheDocument()
  })

  it('로그아웃 클릭 시 토큰 clear + 로그인 페이지로 이동', async () => {
    setAccessToken(FIELD_TOKEN)

    renderAt('/zones')
    const trigger = await screen.findByLabelText('프로필 메뉴 열기')
    await userEvent.click(trigger)

    const logoutItem = await screen.findByText('로그아웃')
    await userEvent.click(logoutItem)

    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
  })

  it('admin 영역에서 로그아웃 시 /admin/login으로 이동', async () => {
    setAccessToken(ADMIN_TOKEN)

    renderAt('/admin/locations')
    const trigger = await screen.findByLabelText('프로필 메뉴 열기')
    await userEvent.click(trigger)

    const logoutItem = await screen.findByText('로그아웃')
    await userEvent.click(logoutItem)

    await waitFor(() => expect(screen.getByText('ADMIN_LOGIN')).toBeInTheDocument())
  })
})
