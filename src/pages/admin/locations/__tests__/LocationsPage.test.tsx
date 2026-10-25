import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { addGroup } from '@/features/groups/api/addGroup'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import LocationsPage from '../LocationsPage'

/**
 * `/admin/locations` 사업장 목록 (`spec 044` T792).
 *
 * 시드 = 실서버 사업장 11곳을 지사에만 둔 mock(사업장은 지사에만 — 사용자 결정 2026-10-23):
 * 2 테스트사업장(수정) ─ 3 강동지사[3 › 4, 9, 11] · 7 본부할당 사업장[2] / 4 test ─ 8 본부할당 사업장[5, 6 › 7 · 8]
 * / 6 테스트그룹 ─ 9 본부할당 사업장[12] / 10 본사 직할 ─ 11 본부할당 사업장[1].
 */

const UrlProbe = () => {
  const { pathname, search } = useLocation()
  return <div data-testid="url">{pathname + search}</div>
}

const renderPage = (initialEntry = '/admin/locations') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/admin/locations" element={<LocationsPage />} />
          <Route path="/admin/locations/:id" element={<div>DETAIL_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const url = () => screen.getByTestId('url').textContent ?? ''
const table = () => within(screen.getByRole('table'))
/** 본문 행(머리 행 제외)의 사업장명 칸 */
const siteNames = () =>
  table()
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].querySelector('.font-medium')?.textContent ?? '')

/** 표 아래 "총 N개" 줄 */
const totalLine = (count: number) =>
  screen.findByText((_, element) => element?.tagName === 'P' && element.textContent === `총 ${count}개`)

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
})

afterEach(() => server.events.removeAllListeners())

describe('LocationsPage — 범위 · 하위 사업장', () => {
  it('지사(3): 그 지사 사업장 + 하위는 └ 들여쓰기 · 부제 · 총 N개', async () => {
    renderPage('/admin/locations?group=3')
    expect(await screen.findByText('강동지사_추가사업장')).toBeInTheDocument()
    expect(siteNames()).toEqual(['테테테(수정)1', '└수정사업장테테', '강동지사_추가사업장', '지가사업장'])
    expect(screen.getByText('강동지사 하위 사업장 4개')).toBeInTheDocument()
    expect(await totalLine(4)).toBeInTheDocument()
  })

  it('루트(그룹 없음): 전체 11곳', async () => {
    renderPage()
    expect(await screen.findByText('에스텍시스템 하위 사업장 11개')).toBeInTheDocument()
    expect(siteNames()).toHaveLength(11)
  })

  it('소속 그룹은 경로(회사 제외) · 주소 없으면 -', async () => {
    renderPage('/admin/locations?group=2')
    const row = (await screen.findByText('테스트사업장')).closest('tr') as HTMLElement
    const cells = within(row).getAllByRole('cell')
    expect(cells[1]).toHaveTextContent('테스트사업장(수정)')
    expect(cells[2]).toHaveTextContent(/^-$/) // 사업장 2 는 주소 null(실측)
    expect(within(table().getAllByRole('row')[2]).getAllByRole('cell')[1]).toHaveTextContent(
      '테스트사업장(수정) › 강동지사'
    )
  })

  it('🔴 담당 관리자는 고정 — · 코스·지점 · 운영 상태는 없다', async () => {
    renderPage('/admin/locations?group=6')
    const row = (await screen.findByText('수정사업장됨')).closest('tr') as HTMLElement
    expect(within(row).getAllByRole('cell')[3]).toHaveTextContent(/^-$/)
    expect(table().getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      '사업장명',
      '소속 그룹',
      '주소',
      '담당 관리자',
    ])
    expect(screen.queryByRole('combobox', { name: '운영 상태' })).not.toBeInTheDocument()
  })
})

describe('LocationsPage — 검색', () => {
  it('주소로 찾는다 · URL ?q= 보존', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('강남우체국')
    await user.type(screen.getByLabelText('사업장명·주소 검색'), '개포로45677')
    // 하위(8)만 맞아 모 사업장(6)과 함께 2행
    expect(await totalLine(2)).toBeInTheDocument()
    expect(url()).toContain('q=')
  })

  it('🔴 하위만 맞으면 모 사업장 행도 남는다', async () => {
    renderPage('/admin/locations?q=용인')
    expect(await screen.findByText('수정사업장테테')).toBeInTheDocument()
    expect(siteNames()).toEqual(['테테테(수정)1', '└수정사업장테테'])
  })

  it('검색 결과 0 과 빈 그룹을 구분한다', async () => {
    renderPage('/admin/locations?group=3&q=없는사업장')
    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('사업장이 없는 그룹', async () => {
    await addGroup({ parentGroupSeq: 2, groupName: '빈지사', userSeq: [] }) // seq 12
    renderPage('/admin/locations?group=12')
    expect(await screen.findByText('이 그룹에 등록된 사업장이 없습니다.')).toBeInTheDocument()
  })
})

describe('LocationsPage — 상태 · 이동', () => {
  it('조회 실패 → 다시 시도로 복구', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('/api/v1/Group/W/sign/GetGroupList', () => new HttpResponse(null, { status: 500 }), { once: true })
    )
    renderPage()
    expect(await screen.findByText('사업장을 불러오지 못했습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('강남우체국')).toBeInTheDocument()
  })

  it('행 클릭 → 상세 경로', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations?group=4')
    await user.click(await screen.findByText('테스트 사업장2-1'))
    expect(await screen.findByText('DETAIL_ROUTE')).toBeInTheDocument()
    expect(url()).toBe('/admin/locations/7')
  })
})

describe('LocationsPage — 추가 (US2)', () => {
  const ADD_PATH = '/api/v1/Site/W/sign/AddSite'

  const captureAdds = () => {
    const bodies: unknown[] = []
    server.events.on('request:start', async ({ request }) => {
      if (new URL(request.url).pathname === ADD_PATH) bodies.push(await request.clone().json())
    })
    return bodies
  }

  const openAdd = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('button', { name: '사업장 추가' }))
    return within(await screen.findByRole('dialog'))
  }

  it('🔴 선택지는 지사만(본부 › 지사) · 지금 보는 지사가 기본값', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations?group=3')
    await screen.findByText('강동지사_추가사업장')
    const dialog = await openAdd(user)

    const select = dialog.getByRole('combobox', { name: '소속 그룹' })
    expect(select).toHaveTextContent('테스트사업장(수정) › 강동지사')
    await user.click(select)
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '테스트사업장(수정) › 강동지사',
      '테스트사업장(수정) › 본부할당 사업장',
      'test › 본부할당 사업장',
      '테스트그룹 › 본부할당 사업장',
      '본사 직할 › 본부할당 사업장',
    ])
  })

  it('본부를 보고 있으면 기본값 없음', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations?group=2')
    await screen.findByText('테스트사업장')
    const dialog = await openAdd(user)
    expect(dialog.getByRole('combobox', { name: '소속 그룹' })).toHaveTextContent('지사를 선택해주세요')
  })

  it('🔴 바디 = 그룹 · 이름 · 주소만(빈 연락처 · 헬스체크 · 예외시간 · 부모 없음) → 닫히고 목록에 새 행', async () => {
    const user = userEvent.setup()
    const bodies = captureAdds()
    renderPage('/admin/locations?group=3')
    await screen.findByText('강동지사_추가사업장')
    const dialog = await openAdd(user)

    await user.type(dialog.getByLabelText('사업장명'), '신규사업장')
    await user.type(dialog.getByLabelText('주소'), '서울시 강동구')
    await user.click(dialog.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('신규사업장')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bodies).toEqual([{ groupSeq: 3, siteName: '신규사업장', address: '서울시 강동구' }])
    expect(screen.getByText('강동지사 하위 사업장 5개')).toBeInTheDocument()
  })

  it('🔴 같은 이름(409) → 모달과 입력값이 남는다', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations?group=3')
    await screen.findByText('강동지사_추가사업장')
    const dialog = await openAdd(user)

    await user.type(dialog.getByLabelText('사업장명'), '지가사업장')
    await user.type(dialog.getByLabelText('주소'), '지가2')
    await user.click(dialog.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(dialog.getByRole('button', { name: '등록' })).toBeEnabled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(dialog.getByLabelText('사업장명')).toHaveValue('지가사업장')
  })
})
