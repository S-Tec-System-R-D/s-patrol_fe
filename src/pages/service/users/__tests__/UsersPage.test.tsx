import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import UsersPage from '../UsersPage'

/**
 * `/users` 근무자 목록 — `spec 038` US1 에서 **테이블 + 서버 타입 + 상세 페이지 이동**으로 바꿨다.
 *
 * 🔴 화면 결과가 아니라 **서버로 나간 쿼리**를 가로채 검증한다(026·037 승계). 특히 파라미터
 * 이름이 서버 것(`siteId`·`searchKey`·`codeSeq`·`workYn`)인지 본다 — B-12.
 * 시드(`mocks/handlers/users.ts`): 사업장 7 · 9명.
 */

const GET_USER_LIST_PATH = '/api/v1/User/W/sign/UserList'

const UrlProbe = () => {
  const { search } = useLocation()
  return <div data-testid="url">{search}</div>
}

const renderPage = (initialEntry = '/users') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userSeq" element={<div>DETAIL_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const url = () => screen.getByTestId('url').textContent ?? ''
/** 🔴 DOM 에 행이 두 벌(테이블 + 카드)이라 영역을 좁힌다(030) */
const inTable = () => within(screen.getByRole('table'))
const inFilters = () => within(screen.getByRole('group', { name: '목록 필터' }))

const captureQuery = () => {
  const calls: URLSearchParams[] = []
  server.events.on('request:start', ({ request }) => {
    const target = new URL(request.url)
    if (target.pathname === GET_USER_LIST_PATH) calls.push(target.searchParams)
  })
  return calls
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
  server.events.removeAllListeners()
})

describe('UsersPage — 서버 목록', () => {
  it('사업장 사람을 테이블로 렌더하고 부제에 인원을 적는다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(inTable().getByText('사번')).toBeInTheDocument()
    expect(inTable().getByText('권한')).toBeInTheDocument()
    expect(inTable().getByText('김민준')).toBeInTheDocument()
    // 헤더 1 + 시드 9
    expect(inTable().getAllByRole('row')).toHaveLength(10)
    expect(screen.getByText('강동 테크노타워 소속 9명')).toBeInTheDocument()
  })

  it('🔴 서버에 없는 컬럼이 없다 — 연락처·사용자 상태·배치중', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(inTable().queryByText('연락처')).not.toBeInTheDocument()
    expect(inTable().queryByText('사용자 상태')).not.toBeInTheDocument()
    expect(screen.queryByText('배치중')).not.toBeInTheDocument()
  })

  it('🔴 우측 상세 패널이 없다 — 행을 누르면 상세 페이지로 간다', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(screen.queryByText('근무자를 선택해주세요')).not.toBeInTheDocument()
    await user.click(inTable().getAllByRole('row')[1])

    expect(await screen.findByText('DETAIL_ROUTE')).toBeInTheDocument()
  })

  it('관리자 행은 권한 뱃지로 구분된다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(inTable().getByText('현장 관리자')).toBeInTheDocument()
  })

  it('원소속은 Seq 가 있는 행에만 보인다 (OQ-038-B)', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(inTable().getAllByText('강서 스퀘어타워')).toHaveLength(1)
    expect(inTable().queryByText('강동 테크노타워')).not.toBeInTheDocument()
  })

  it('추가 버튼은 필터 줄에 있고 모달을 연다', async () => {
    const user = userEvent.setup()
    renderPage()

    const button = screen.getByRole('button', { name: '근무자 추가' })
    expect(button.parentElement).toContainElement(screen.getByLabelText('이름 검색'))
    await user.click(button)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})

describe('UsersPage — 상태 분기', () => {
  it('🔴 403(현장관리자, B-41)도 조회 실패로 그린다 — "없음" 이 아니다', async () => {
    server.use(http.get(GET_USER_LIST_PATH, () => new HttpResponse(null, { status: 403 })))
    renderPage()

    expect(await screen.findByText('근무자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.queryByText('등록된 근무자가 없습니다')).not.toBeInTheDocument()
  })

  it('🔴 로딩 중에 "근무자 없음" 이 뜨지 않는다', () => {
    renderPage()

    expect(screen.queryByText('등록된 근무자가 없습니다')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('🔴 0건과 필터 0건을 다르게 그린다', async () => {
    renderPage('/users?q=없는사람')

    expect(await screen.findByText('조건에 맞는 근무자가 없습니다')).toBeInTheDocument()
    expect(screen.getByLabelText('필터 초기화')).toBeInTheDocument()
  })

  it('필터 없이 0건이면 "등록된 근무자가 없습니다"', async () => {
    setSite(8, '다른 사업장')
    renderPage()

    expect(await screen.findByText('등록된 근무자가 없습니다')).toBeInTheDocument()
  })
})

describe('UsersPage — 필터가 서버로 나간다', () => {
  it('🔴 URL 의 검색·권한·근무 상태·페이지가 서버 이름의 파라미터로 실린다 (B-12)', async () => {
    const calls = captureQuery()
    renderPage('/users?q=김&role=7&work=true&page=2')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    const query = calls[calls.length - 1]
    expect(query.get('siteId')).toBe('7')
    expect(query.get('siteSeq')).toBeNull()
    expect(query.get('searchKey')).toBe('김')
    expect(query.get('codeSeq')).toBe('7')
    expect(query.get('workYn')).toBe('true')
    expect(query.get('pageNumber')).toBe('2')
  })

  it('🔴 권한 선택지는 실측 2종 + 전체뿐이다', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    await user.click(inFilters().getByLabelText('권한'))

    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['전체', '현장 관리자', '현장 근무자'])
  })

  it('🔴 필터를 바꾸면 첫 페이지로 돌아가고 "전체" 는 키를 지운다', async () => {
    const user = userEvent.setup()
    renderPage('/users?page=2&work=true')

    await waitFor(() => expect(url()).toContain('page=2'))
    await user.click(inFilters().getByLabelText('근무 상태'))
    await user.click(await screen.findByRole('option', { name: '전체' }))

    await waitFor(() => expect(url()).not.toContain('work'))
    expect(url()).not.toContain('page=2')
  })

  it('필터 초기화는 검색·권한·근무 상태를 함께 지운다', async () => {
    const user = userEvent.setup()
    renderPage('/users?q=없는사람&role=6&work=false')

    await user.click(await screen.findByLabelText('필터 초기화'))

    await waitFor(() => expect(url()).toBe(''))
    expect(screen.getByLabelText('이름 검색')).toHaveValue('')
  })

  it('🔴 pageSize 는 서버 상한(100)을 넘지 않는다', async () => {
    const calls = captureQuery()
    renderPage('/users?size=500')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    expect(Number(calls[calls.length - 1].get('pageSize'))).toBeLessThanOrEqual(100)
  })
})
