import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import ServiceLayout from '../../ServiceLayout'

/**
 * 현장 레일 — `ServiceLayout` 으로 렌더한다(`spec 043` T743). 배치 대기 뱃지 숫자는 레이아웃이 세서 레일에 넘긴다.
 *
 * 🔴 **레일 영역(`메뉴`) 안에서 찾는다**(`spec 053`) — jsdom 은 미디어쿼리를 적용하지 않아
 * 하단 `FloatingNav` 도 함께 렌더된다. 화면 전체에서 찾으면 같은 이름의 링크가 두 개다.
 */

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

const renderRail = (initialPath: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ServiceLayout />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return within(screen.getByRole('navigation', { name: '메뉴' }))
}

describe('RailSidebar (현장)', () => {
  it('5개 메뉴 아이콘 flat 렌더(순찰이력·코스/지점·근무자·배치관리·공지사항)', () => {
    const rail = renderRail('/zones')
    expect(rail.getByLabelText('순찰이력')).toBeInTheDocument()
    expect(rail.getByLabelText('코스/지점')).toBeInTheDocument()
    expect(rail.getByLabelText('근무자')).toBeInTheDocument()
    expect(rail.getByLabelText('배치관리')).toBeInTheDocument()
    expect(rail.getByLabelText('공지사항')).toBeInTheDocument()
  })

  it('현재 경로(/zones)에 해당하는 메뉴가 활성 상태(bg-rail-2)', () => {
    const rail = renderRail('/zones')
    expect(rail.getByLabelText('코스/지점')).toHaveClass('bg-rail-2')
    expect(rail.getByLabelText('근무자')).not.toHaveClass('bg-rail-2')
  })

  it('🔴 배치관리 뱃지는 요약 쿼리의 대기 건수다 (spec 039 — store 직접 읽기 제거)', async () => {
    const rail = renderRail('/zones')

    expect(await within(rail.getByLabelText('배치관리')).findByText('2')).toBeInTheDocument()
  })

  it('요약 조회가 실패하면 뱃지를 그리지 않는다 — 숫자를 지어내지 않는다', async () => {
    server.use(
      http.get('/api/v1/Assignment/W/sign/GetAssignmentCount', () =>
        HttpResponse.json({ message: 'x' }, { status: 500 })
      )
    )
    const rail = renderRail('/zones')

    // 실패가 반영될 시간을 준 뒤에도 숫자가 없다
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(within(rail.getByLabelText('배치관리')).queryByText(/\d/)).not.toBeInTheDocument()
  })

  it('현장 레일에는 사이트 태그가 없다', () => {
    renderRail('/zones')
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
  })

  it('🔴 레일은 xl 이상에서만 보인다 (spec 053)', () => {
    renderRail('/zones')
    expect(screen.getByRole('navigation', { name: '메뉴' }).parentElement).toHaveClass('hidden', 'xl:flex')
  })

  it('하단은 프로필이 아니라 로그아웃 버튼이다 (spec 053) — 레일 · floating nav 각 1개', () => {
    renderRail('/zones')
    expect(screen.getAllByRole('button', { name: '로그아웃' })).toHaveLength(2)
    expect(screen.queryByLabelText('프로필 메뉴 열기')).not.toBeInTheDocument()
  })
})
