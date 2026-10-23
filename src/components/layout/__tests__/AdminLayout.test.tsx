import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import AdminLayout from '../AdminLayout'

/**
 * 본사 레일 셸 (`spec 043` T747) — `ADMIN` 태그 · 메뉴 2개 · TopNav 없음 · 🔴 배치 요약 요청 0건.
 */

const requested: string[] = []

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  requested.length = 0
  server.events.on('request:start', ({ request }) => {
    requested.push(new URL(request.url).pathname)
  })
})

afterEach(() => server.events.removeAllListeners())

const renderAdmin = (initialPath = '/admin/locations') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AdminLayout />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AdminLayout', () => {
  it('레일 — ADMIN 태그 · 메뉴 2개(사업장·관리자) · 현재 메뉴 활성', () => {
    renderAdmin('/admin/locations')
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.getByLabelText('사업장')).toHaveClass('bg-rail-2')
    expect(screen.getByLabelText('관리자')).not.toHaveClass('bg-rail-2')
    expect(screen.getByLabelText('프로필 메뉴 열기')).toBeInTheDocument()
  })

  it('사업장 상세 경로에서도 사업장 메뉴가 활성', () => {
    renderAdmin('/admin/locations/3')
    expect(screen.getByLabelText('사업장')).toHaveClass('bg-rail-2')
  })

  it('🔴 본사에서는 배치 요약(GetAssignmentCount)을 부르지 않는다', async () => {
    renderAdmin()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requested).not.toContain('/api/v1/Assignment/W/sign/GetAssignmentCount')
  })
})
