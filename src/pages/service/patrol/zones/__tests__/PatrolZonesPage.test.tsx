import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import PatrolZonesPage from '../PatrolZonesPage'
import { server } from '@/mocks/server'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/patrol/zones` 코스 순찰이력 목록 — `spec 036` Phase 3 에서 **서버로 전환**했다.
 *
 * 이전 테스트는 **페이지에 박힌 mock 배열**(24건)을 보고 클라이언트 필터 결과를 셌다.
 * 지금은 027·023 과 같은 관심사를 본다 — 🔴 **화면 결과가 아니라 서버로 나간 쿼리**를
 * 가로채 검증한다(화면만 보면 "서버가 걸렀는지 우리가 걸렀는지" 알 수 없다).
 */

const GET_COURSE_HISTORY_PATH = '/api/v1/History/W/sign/GetCourseHistory'

const UrlProbe = () => {
  const { search } = useLocation()
  return <div data-testid="url">{search}</div>
}

const renderPage = (initialEntry = '/patrol/zones') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/patrol/zones" element={<PatrolZonesPage />} />
          <Route path="/patrol/zones/:historySeq" element={<div>DETAIL_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const url = () => screen.getByTestId('url').textContent ?? ''

/**
 * 🔴 **`spec 030` 부터 DOM 에 행이 두 벌이다** — 테이블과 카드를 동시에 렌더하고 CSS 로
 * 숨긴다. jsdom 에는 스타일시트가 없어 **둘 다 조회되므로** 영역을 좁힌다.
 */
const inTable = () => within(screen.getByRole('table'))
const inFilters = () => within(screen.getByRole('group', { name: '목록 필터' }))

/** 서버로 나간 쿼리를 모은다 */
const captureQuery = () => {
  const calls: URLSearchParams[] = []
  server.events.on('request:start', ({ request }) => {
    const target = new URL(request.url)
    if (target.pathname === GET_COURSE_HISTORY_PATH) calls.push(target.searchParams)
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

describe('PatrolZonesPage — 서버 목록', () => {
  it('선택한 사업장의 이력을 테이블로 렌더한다', async () => {
    renderPage()

    await screen.findAllByText('A동 순찰코스')
    expect(inTable().getAllByText('A동 순찰코스').length).toBeGreaterThan(0)
    expect(screen.getByText('지점 인증')).toBeInTheDocument()
    expect(screen.getByText('순찰 결과')).toBeInTheDocument()
    expect(screen.getByText('특이사항')).toBeInTheDocument()
  })

  it('🔴 mock 셸이 남아 있지 않다 — 우측 상세 패널과 내보내기 버튼이 없다', async () => {
    renderPage()

    await screen.findAllByText('A동 순찰코스')
    // 마스터-디테일을 버렸다. 상세는 별 라우트다
    expect(screen.queryByText('순찰 정보')).not.toBeInTheDocument()
    expect(screen.queryByText('DETAIL_ROUTE')).not.toBeInTheDocument()
    // Export 는 서버 엔드포인트가 없어 범위에서 빠졌다
    expect(screen.queryByRole('button', { name: '내보내기' })).not.toBeInTheDocument()
  })

  it('🔴 헤더를 클릭해도 정렬되지 않는다 — 서버에 정렬 파라미터가 없다', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('A동 순찰코스')
    const firstRowBefore = inTable().getAllByRole('row')[1].textContent

    // 🔴 **아이콘이 아니라 동작으로 본다.** `AppTable` 은 정렬 아이콘을 접근성 이름이
    //    없는 svg 로 그리고 헤더는 `button` 이 아니라 `th` 라, 아이콘을 찾는 단언은
    //    **켜져 있어도 통과한다**(실제로 그래서 놓쳤다 — 브라우저 확인 2026-10-16).
    await user.click(screen.getByText('시작 일시'))

    // 서버 페이징 중 클라이언트 정렬은 **현재 페이지의 N행만** 섞는데 화면은 정렬된
    // 것처럼 보인다 — 2페이지의 더 이른 시각은 올라오지 않으므로 틀린 순서를 맞는
    // 것으로 읽는다
    expect(inTable().getAllByRole('row')[1].textContent).toBe(firstRowBefore)
  })

  it('행을 클릭하면 회차 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findAllByText('A동 순찰코스')
    await user.click(inTable().getAllByText('A동 순찰코스')[0])

    expect(await screen.findByText('DETAIL_ROUTE')).toBeInTheDocument()
  })

  it('🔴 조회 실패를 "이력 없음" 으로 보여주지 않는다', async () => {
    server.use(
      http.get(GET_COURSE_HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 }))
    )
    renderPage()

    expect(await screen.findByText('순찰이력을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('순찰이력이 없습니다.')).not.toBeInTheDocument()
  })

  it('🔴 0건과 필터 0건을 다르게 그린다', async () => {
    renderPage('/patrol/zones?result=1&user=없는사람')

    expect(await screen.findByText('조건에 맞는 순찰이력이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('순찰이력이 없습니다.')).not.toBeInTheDocument()
  })
})

describe('PatrolZonesPage — 필터가 서버로 나간다', () => {
  it('🔴 URL 의 필터가 서버 파라미터로 실린다', async () => {
    const calls = captureQuery()
    renderPage('/patrol/zones?from=2026-05-01&to=2026-05-07&course=1&result=1&user=박성민')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    const query = calls[calls.length - 1]
    expect(query.get('siteSeq')).toBe('7')
    expect(query.get('fromDt')).toBe('2026-05-01')
    expect(query.get('toDt')).toBe('2026-05-07')
    expect(query.get('courseSeq')).toBe('1')
    expect(query.get('eventType')).toBe('1')
    expect(query.get('userName')).toBe('박성민')
  })

  it('🔴 "전체" 센티넬이 URL·서버로 새지 않는다', async () => {
    const user = userEvent.setup()
    const calls = captureQuery()
    renderPage('/patrol/zones?result=1')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    await user.click(inFilters().getByLabelText('결과'))
    await user.click(await screen.findByRole('option', { name: '전체' }))

    await waitFor(() => expect(url()).not.toContain('result'))
    expect(url()).not.toContain('ALL')
    await waitFor(() => {
      const query = calls[calls.length - 1]
      expect(query.get('eventType')).toBeNull()
    })
  })

  it('🔴 필터를 바꾸면 첫 페이지로 돌아간다', async () => {
    const user = userEvent.setup()
    renderPage('/patrol/zones?page=3')

    await waitFor(() => expect(url()).toContain('page=3'))
    await user.click(inFilters().getByLabelText('결과'))
    await user.click(await screen.findByRole('option', { name: '완료' }))

    // 3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있고 그러면 정상 응답인 빈 화면이 된다
    await waitFor(() => expect(url()).not.toContain('page=3'))
  })

  it('🔴 pageSize 는 서버 상한(100)을 넘지 않는다', async () => {
    const calls = captureQuery()
    renderPage('/patrol/zones?size=500')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    expect(Number(calls[calls.length - 1].get('pageSize'))).toBeLessThanOrEqual(100)
  })

  it('🔴 순찰자는 드롭다운이 아니라 텍스트 입력이다 — UserList 가 403 이다', async () => {
    renderPage()

    await screen.findAllByText('A동 순찰코스')
    expect(inFilters().getByLabelText('순찰자 검색')).toBeInTheDocument()
    expect(inFilters().queryByLabelText('순찰자')).not.toBeInTheDocument()
  })
})

describe('PatrolZonesPage — 실측 예외를 화면이 감당한다', () => {
  it('🔴 순찰자가 없는 이력에 "순찰자 미지정" 을 적는다 (실측 35%)', async () => {
    renderPage()

    // mock 시드 historySeq 106 이 `userList: []` 다
    expect((await screen.findAllByText('순찰자 미지정')).length).toBeGreaterThan(0)
  })

  it('🔴 진행 중 회차의 종료 일시는 "—" 가 아니라 "진행 중" 이다', async () => {
    renderPage()

    // `—` 는 값 누락으로 읽힌다(030 선례)
    expect((await screen.findAllByText('진행 중')).length).toBeGreaterThan(0)
  })

  it('🔴 결과 뱃지와 시간초과 뱃지를 함께 보여준다', async () => {
    renderPage()

    // mock 시드 historySeq 104 가 `overtimeYn: true` + `status: 1` 이다
    await screen.findAllByText('A동 순찰코스')
    expect(inTable().getAllByText('완료').length).toBeGreaterThan(0)
    expect(inTable().getAllByText('시간초과').length).toBeGreaterThan(0)
  })

  it('🔴 완료인데 인증 0건인 행도 그대로 그린다 — 상태와 인증률은 독립이다', async () => {
    renderPage()

    await screen.findAllByText('A동 순찰코스')
    // historySeq 105: status 1(완료) + checkedCount 0
    expect(inTable().getAllByText('0/3').length).toBeGreaterThan(0)
  })
})
