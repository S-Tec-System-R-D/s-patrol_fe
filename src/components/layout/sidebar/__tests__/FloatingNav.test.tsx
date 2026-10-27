import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { makeAccessToken } from '@/test/jwt'
import ServiceLayout from '../../ServiceLayout'

/**
 * 현장 하단 floating nav (`spec 053`) — `ServiceLayout` 으로 렌더해 레일과 같은 뱃지 숫자를 받는지 본다.
 */

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

const renderNav = (initialPath: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ServiceLayout />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return within(screen.getByRole('navigation', { name: '하단 메뉴' }))
}

describe('FloatingNav (현장)', () => {
  it('🔴 xl 미만에서만 보인다 · 하단 고정 · 모달(z-50) 아래(z-40)', () => {
    renderNav('/zones')
    expect(screen.getByRole('navigation', { name: '하단 메뉴' })).toHaveClass('xl:hidden', 'fixed', 'z-40')
  })

  it('레일과 같은 순서의 메뉴 5개 + 로그아웃', () => {
    const nav = renderNav('/zones')
    expect(nav.getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      '순찰이력',
      '코스/지점',
      '근무자',
      '배치관리',
      '공지사항',
    ])
    expect(nav.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('현재 경로의 메뉴가 활성 — 지점 경로(/points)도 코스/지점', () => {
    const nav = renderNav('/points')
    expect(nav.getByLabelText('코스/지점')).toHaveClass('bg-rail-2')
    expect(nav.getByLabelText('근무자')).not.toHaveClass('bg-rail-2')
  })

  it('배치관리 뱃지 — 레일과 같은 대기 건수', async () => {
    const nav = renderNav('/zones')
    expect(await within(nav.getByLabelText('배치관리')).findByText('2')).toBeInTheDocument()
  })

  it('🔴 콘텐츠 영역은 xl 미만에서 하단 여백을 둔다 — nav 가 마지막 행을 가리지 않게', () => {
    renderNav('/zones')
    const content = screen.getByRole('navigation', { name: '하단 메뉴' }).previousElementSibling
    expect(content).toHaveClass('pb-24', 'xl:pb-0')
  })
})
