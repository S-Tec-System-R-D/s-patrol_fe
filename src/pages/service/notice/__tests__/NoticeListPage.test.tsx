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
import NoticeListPage from '../NoticeListPage'

/**
 * `/notice` 공지사항 목록 — `spec 026` US1 에서 **테이블 + 서버 목록**으로 바꿨다.
 *
 * 🔴 037 과 같은 관심사를 본다 — 화면 결과가 아니라 **서버로 나간 쿼리**를 가로채 검증한다
 * (화면만 보면 서버가 걸렀는지 우리가 걸렀는지 알 수 없다).
 */

const GET_NOTICE_LIST_PATH = '/api/v1/Notice/W/sign/GetNoticeList'

const UrlProbe = () => {
  const { search } = useLocation()
  return <div data-testid="url">{search}</div>
}

const renderPage = (initialEntry = '/notice') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/notice" element={<NoticeListPage />} />
          <Route path="/notice/:noticeSeq" element={<div>DETAIL_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const url = () => screen.getByTestId('url').textContent ?? ''

/** 🔴 `spec 030` 부터 DOM 에 행이 두 벌(테이블 + 카드)이라 영역을 좁힌다 */
const inTable = () => within(screen.getByRole('table'))

const captureQuery = () => {
  const calls: URLSearchParams[] = []
  server.events.on('request:start', ({ request }) => {
    const target = new URL(request.url)
    if (target.pathname === GET_NOTICE_LIST_PATH) calls.push(target.searchParams)
  })
  return calls
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '테스트 사업장')
})

afterEach(() => {
  clearTokens()
  server.events.removeAllListeners()
})

describe('NoticeListPage — 서버 목록', () => {
  it('선택한 사업장의 공지를 테이블로 렌더한다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(inTable().getByText('제목')).toBeInTheDocument()
    expect(inTable().getByText('작성자')).toBeInTheDocument()
    expect(inTable().getByText('작성일')).toBeInTheDocument()
    expect(inTable().getByText('6월 정기 순찰 점검 안내')).toBeInTheDocument()
    // 헤더 1 + 시드 5
    expect(inTable().getAllByRole('row')).toHaveLength(6)
  })

  it('고정 공지와 첨부 유무를 아이콘으로 표시한다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(inTable().getAllByLabelText('고정 공지')).toHaveLength(1)
    expect(inTable().getByLabelText('첨부 4개')).toBeInTheDocument()
  })

  it('🔴 서버에 없는 값은 그리지 않는다 — 읽음·신규·앱 푸시 뱃지가 없다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(screen.queryByText('읽음')).not.toBeInTheDocument()
    expect(screen.queryByText('신규')).not.toBeInTheDocument()
    expect(screen.queryByText('앱 푸시 발송')).not.toBeInTheDocument()
  })

  it('행을 클릭하면 공지 상세로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    await user.click(inTable().getAllByRole('row')[1])

    expect(await screen.findByText('DETAIL_ROUTE')).toBeInTheDocument()
  })

  it('🔴 헤더를 클릭해도 정렬되지 않는다 — 서버에 정렬 파라미터가 없다', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    const firstRowBefore = inTable().getAllByRole('row')[1].textContent

    await user.click(inTable().getByText('제목'))

    expect(inTable().getAllByRole('row')[1].textContent).toBe(firstRowBefore)
  })

  it('🔴 고정 공지 행만 배경을 칠한다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    const pinnedRow = inTable().getByLabelText('고정 공지').closest('tr')
    const normalRow = inTable().getByText('야간 순찰 강화 공지').closest('tr')
    expect(pinnedRow).toHaveClass('bg-point-bg/50')
    expect(normalRow).not.toHaveClass('bg-point-bg/50')
  })

  it('🔴 작성 버튼은 필터 줄에 있다 — 헤더가 아니다', async () => {
    renderPage()

    const button = screen.getByRole('button', { name: '공지 작성' })
    expect(button.closest('header')).toBeNull()
    expect(button.parentElement).toContainElement(screen.getByLabelText('제목 검색'))
  })

  it('작성 모달을 연다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '공지 작성' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})

describe('NoticeListPage — 상태 분기', () => {
  it('🔴 조회 실패를 "공지 없음" 으로 보여주지 않는다', async () => {
    server.use(
      http.get(GET_NOTICE_LIST_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 }))
    )
    renderPage()

    expect(await screen.findByText('공지사항을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.queryByText('등록된 공지가 없습니다')).not.toBeInTheDocument()
  })

  it('🔴 로딩 중에 "공지 없음" 이 뜨지 않는다', () => {
    renderPage()

    expect(screen.queryByText('등록된 공지가 없습니다')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('🔴 0건과 필터 0건을 다르게 그린다', async () => {
    renderPage('/notice?q=없는공지')

    expect(await screen.findByText('조건에 맞는 공지가 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('등록된 공지가 없습니다')).not.toBeInTheDocument()
    expect(screen.getByLabelText('필터 초기화')).toBeInTheDocument()
  })

  it('필터 없이 0건이면 "등록된 공지가 없습니다"', async () => {
    server.use(
      http.get(GET_NOTICE_LIST_PATH, () =>
        HttpResponse.json({
          message: '',
          code: 200,
          data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
        })
      )
    )
    renderPage()

    expect(await screen.findByText('등록된 공지가 없습니다')).toBeInTheDocument()
    expect(screen.queryByLabelText('필터 초기화')).not.toBeInTheDocument()
  })
})

describe('NoticeListPage — 필터가 서버로 나간다', () => {
  it('🔴 URL 의 검색·기간·페이지가 서버 파라미터로 실린다', async () => {
    const calls = captureQuery()
    renderPage('/notice?q=점검&from=2026-05-01&to=2026-05-31&page=2')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    const query = calls[calls.length - 1]
    expect(query.get('siteSeq')).toBe('7')
    expect(query.get('keyword')).toBe('점검')
    expect(query.get('fromDt')).toBe('2026-05-01')
    expect(query.get('toDt')).toBe('2026-05-31')
    expect(query.get('pageNumber')).toBe('2')
  })

  it('🔴 검색어를 입력하면 디바운스 뒤 URL 과 서버로 나가고 첫 페이지로 돌아간다', async () => {
    const user = userEvent.setup()
    const calls = captureQuery()
    renderPage('/notice?page=2')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    await user.type(screen.getByLabelText('제목 검색'), '교육')

    await waitFor(() => expect(url()).toContain('q=%EA%B5%90%EC%9C%A1'))
    expect(url()).not.toContain('page=2')
    await waitFor(() => expect(calls[calls.length - 1].get('keyword')).toBe('교육'))
    expect(await screen.findAllByText('5월 순찰 교육 일정 안내')).not.toHaveLength(0)
  })

  it('필터 초기화는 검색·기간·페이지를 함께 지운다', async () => {
    const user = userEvent.setup()
    renderPage('/notice?q=없는공지&from=2026-05-01&to=2026-05-31')

    await user.click(await screen.findByLabelText('필터 초기화'))

    await waitFor(() => expect(url()).toBe(''))
    expect(screen.getByLabelText('제목 검색')).toHaveValue('')
  })

  it('🔴 siteSeq 는 URL 에 없다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(url()).not.toContain('siteSeq')
  })

  it('🔴 pageSize 는 서버 상한(100)을 넘지 않는다', async () => {
    const calls = captureQuery()
    renderPage('/notice?size=500')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    expect(Number(calls[calls.length - 1].get('pageSize'))).toBeLessThanOrEqual(100)
  })
})
