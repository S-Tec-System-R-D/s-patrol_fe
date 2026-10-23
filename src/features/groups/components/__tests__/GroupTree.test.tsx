import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { branchSiteCount } from '../../lib/groupTree'
import { GroupFilterButton } from '../GroupFilterButton'
import { GroupFilterPanel } from '../GroupFilterPanel'

/**
 * 관리그룹 트리 · 패널 · 시트 버튼 (`spec 043` T753).
 *
 * 시드 = 실서버 트리: 1 에스텍시스템(사업장 11) ─ 2 테스트사업장(수정)(5) ─ 3 강동지사(4) / 4 test(4) / 6 테스트그룹(1).
 * 🔴 개수는 **지사 행에만** "N개" 로(사용자 결정 2026-10-22). 하위 사업장(`children`)까지 센다 — 3 = 테테테(수정)1 · 수정사업장테테 · 9 · 11.
 */

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
})

const LocationProbe = () => <div data-testid="search">{useLocation().search}</div>

const renderWith = (ui: React.ReactNode, initialPath = '/admin/locations') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        {ui}
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const panel = (initialPath?: string) =>
  renderWith(<GroupFilterPanel unitLabel="사업장" count={branchSiteCount} />, initialPath)

const row = (name: string) => screen.getByText(name).closest('[role="treeitem"]') as HTMLElement

describe('GroupFilterPanel', () => {
  it('🔴 전부 펼친 트리 · 개수는 지사 행에만 "N개"', async () => {
    panel()
    expect(await screen.findByText('강동지사')).toBeInTheDocument()
    expect(within(row('강동지사')).getByText('4개')).toBeInTheDocument()
    expect(within(row('에스텍시스템')).queryByText(/개$/)).not.toBeInTheDocument()
    expect(within(row('test')).queryByText(/개$/)).not.toBeInTheDocument()
    expect(screen.getByText('관리그룹')).toBeInTheDocument()
    expect(screen.getByText('사업장 수')).toBeInTheDocument()
  })

  it('단계 기호 — 본부만 본부 아이콘 · 지사만 네모 닷 · 회사는 화살표뿐', async () => {
    panel()
    await screen.findByText('강동지사')
    expect(within(row('테스트사업장(수정)')).getByTestId('hq-icon')).toBeInTheDocument()
    expect(within(row('강동지사')).getByTestId('branch-dot')).toBeInTheDocument()
    expect(within(row('에스텍시스템')).queryByTestId('hq-icon')).not.toBeInTheDocument()
    expect(within(row('에스텍시스템')).queryByTestId('branch-dot')).not.toBeInTheDocument()
    expect(within(row('test')).queryByTestId('branch-dot')).not.toBeInTheDocument()
  })

  it('?group 이 없으면 루트가 선택돼 있다', async () => {
    panel()
    await screen.findByText('강동지사')
    expect(row('에스텍시스템')).toHaveAttribute('aria-selected', 'true')
  })

  it('행을 누르면 ?group 이 바뀌고 그 행이 선택된다', async () => {
    panel()
    await userEvent.click(await screen.findByText('강동지사'))
    expect(screen.getByTestId('search')).toHaveTextContent('?group=3')
    expect(row('강동지사')).toHaveAttribute('aria-selected', 'true')
  })

  it.each(['?group=abc', '?group=999'])('잘못된 값(%s)은 루트로 본다', async (search) => {
    panel(`/admin/locations${search}`)
    await screen.findByText('강동지사')
    expect(row('에스텍시스템')).toHaveAttribute('aria-selected', 'true')
  })

  it('접으면 하위가 사라지고, 접기는 선택을 바꾸지 않는다', async () => {
    panel('/admin/locations?group=4')
    await userEvent.click(await screen.findByLabelText('테스트사업장(수정) 접기'))
    expect(screen.queryByText('강동지사')).not.toBeInTheDocument()
    expect(screen.getByTestId('search')).toHaveTextContent('?group=4')
  })

  it('트리 조회 실패 → 다시 시도', async () => {
    server.use(
      http.get('/api/v1/Login/W/sign/AdminSiteSelect', () => new HttpResponse(null, { status: 500 }))
    )
    panel()
    expect(await screen.findByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})

describe('GroupFilterButton', () => {
  it('경로는 루트를 빼고 표시 · 시트에서 고르면 닫히고 ?group 이 바뀐다', async () => {
    renderWith(<GroupFilterButton unitLabel="사업장" count={branchSiteCount} />, '/admin/locations?group=3')
    const button = await screen.findByRole('button', { name: '관리그룹 선택' })
    expect(await within(button).findByText('강동지사')).toBeInTheDocument()
    expect(within(button).getByText(/테스트사업장\(수정\) ›/)).toBeInTheDocument()

    await userEvent.click(button)
    const sheet = await screen.findByRole('dialog')
    await userEvent.click(within(sheet).getByText('test'))

    expect(screen.getByTestId('search')).toHaveTextContent('?group=4')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
