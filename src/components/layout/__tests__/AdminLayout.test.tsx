import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import AdminLayout from '../AdminLayout'

/**
 * 본사 레일 셸 (`spec 043` T747) — `ADMIN` 태그 · 메뉴 2개 · TopNav 없음 · 🔴 배치 요약 요청 0건.
 * 🔴 레일 영역(`메뉴`) 안에서 찾는다 — jsdom 에서는 `FloatingNav` 도 함께 렌더된다(`spec 053`).
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

const rail = () => within(screen.getByRole('navigation', { name: '메뉴' }))
const floating = () => within(screen.getByRole('navigation', { name: '하단 메뉴' }))

describe('AdminLayout', () => {
  it('레일 — ADMIN 태그 · 메뉴 2개(사업장·관리자) · 현재 메뉴 활성', () => {
    renderAdmin('/admin/locations')
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(rail().getByLabelText('사업장')).toHaveClass('bg-rail-2')
    expect(rail().getByLabelText('관리자')).not.toHaveClass('bg-rail-2')
  })

  it('사업장 상세 경로에서도 사업장 메뉴가 활성', () => {
    renderAdmin('/admin/locations/3')
    expect(rail().getByLabelText('사업장')).toHaveClass('bg-rail-2')
  })

  it('floating nav (spec 053) — 메뉴 2개 · 현재 메뉴 활성 · 로그아웃', () => {
    renderAdmin('/admin/admins')
    expect(floating().getAllByRole('link')).toHaveLength(2)
    expect(floating().getByLabelText('관리자')).toHaveClass('bg-rail-2')
    expect(floating().getByLabelText('사업장')).not.toHaveClass('bg-rail-2')
    expect(floating().getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('🔴 본사에서는 배치 요약(GetAssignmentCount)을 부르지 않는다', async () => {
    renderAdmin()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(requested).not.toContain('/api/v1/Assignment/W/sign/GetAssignmentCount')
  })
})
