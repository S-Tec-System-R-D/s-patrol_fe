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
import PatrolPointsPage from '../PatrolPointsPage'

/**
 * `/patrol/points` 지점 순찰이력 목록 — `spec 037` Phase 3 에서 **서버로 전환**했다.
 *
 * 이전 화면은 페이지에 박힌 **mock 배열 12건**을 보고 있었고 필터 버튼은 **아무 동작도
 * 하지 않았다**(018 이 보류한 자리). 지금은 036 과 같은 관심사를 본다 — 🔴 **화면 결과가
 * 아니라 서버로 나간 쿼리**를 가로채 검증한다(화면만 보면 "서버가 걸렀는지 우리가
 * 걸렀는지" 알 수 없다).
 */

const GET_POINT_HISTORY_PATH = '/api/v1/History/W/sign/GetPointHistory'

const UrlProbe = () => {
  const { search } = useLocation()
  return <div data-testid="url">{search}</div>
}

const renderPage = (initialEntry = '/patrol/points') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/patrol/points" element={<PatrolPointsPage />} />
          <Route path="/patrol/points/:detailSeq" element={<div>DETAIL_ROUTE</div>} />
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
    if (target.pathname === GET_POINT_HISTORY_PATH) calls.push(target.searchParams)
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

describe('PatrolPointsPage — 서버 목록', () => {
  it('선택한 사업장의 인증 기록을 테이블로 렌더한다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(screen.getByText('순찰일시')).toBeInTheDocument()
    expect(screen.getByText('순찰지점')).toBeInTheDocument()
    expect(screen.getByText('인증수단')).toBeInTheDocument()
    expect(screen.getByText('구간')).toBeInTheDocument()
    expect(inTable().getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('🔴 mock 셸이 남아 있지 않다 — 기록 모달과 내보내기 버튼이 없다', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    // 상세가 페이지가 되면서 기록 다이얼로그가 사라졌다
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Export 는 서버 엔드포인트가 없어 범위에서 빠졌다(036 과 같은 처리)
    expect(screen.queryByRole('button', { name: '내보내기' })).not.toBeInTheDocument()
  })

  it('행을 클릭하면 인증 1건 상세로 이동한다', async () => {
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

    // 🔴 **아이콘이 아니라 동작으로 본다** — `AppTable` 의 정렬 아이콘은 접근성 이름이
    //    없는 svg 라, 아이콘을 찾는 단언은 **정렬이 켜져 있어도 통과한다**(036 선례)
    await user.click(screen.getByText('순찰일시'))

    expect(inTable().getAllByRole('row')[1].textContent).toBe(firstRowBefore)
  })

  it('🔴 조회 실패를 "기록 없음" 으로 보여주지 않는다', async () => {
    server.use(
      http.get(GET_POINT_HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 }))
    )
    renderPage()

    expect(await screen.findByText('순찰이력을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('인증 기록이 없습니다')).not.toBeInTheDocument()
  })

  it('🔴 0건과 필터 0건을 다르게 그린다', async () => {
    renderPage('/patrol/points?user=없는사람')

    expect(await screen.findByText('조건에 맞는 인증 기록이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('인증 기록이 없습니다')).not.toBeInTheDocument()
    // 🔴 빈 상태에 초기화 버튼을 두지 않는다 — 필터 바의 아이콘이 항상 보이는 자리에 있다
    expect(screen.getAllByLabelText('필터 초기화')).toHaveLength(1)
  })
})

describe('PatrolPointsPage — 필터가 서버로 나간다', () => {
  it('🔴 URL 의 필터 4종 + 검색이 서버 파라미터로 실린다', async () => {
    const calls = captureQuery()
    renderPage(
      '/patrol/points?from=2026-05-01&to=2026-05-07&course=1&auth=9&result=4&user=김근무'
    )

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    const query = calls[calls.length - 1]
    expect(query.get('siteSeq')).toBe('7')
    expect(query.get('fromDt')).toBe('2026-05-01')
    expect(query.get('toDt')).toBe('2026-05-07')
    expect(query.get('courseSeq')).toBe('1')
    expect(query.get('authMethod')).toBe('9')
    expect(query.get('status')).toBe('4')
    expect(query.get('userName')).toBe('김근무')
  })

  it('🔴 결과 선택지는 2종뿐이다 — 거를 수 없는 값을 두지 않는다', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    await user.click(inFilters().getByLabelText('결과'))

    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['전체', '미완료', '완료'])
    // 고르면 0건이 돌아오는 필터는 "데이터가 없다" 는 거짓 신호를 준다
    expect(screen.queryByRole('option', { name: '시간초과' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '순찰제외' })).not.toBeInTheDocument()
  })

  it('🔴 "전체" 센티넬이 URL·서버로 새지 않는다', async () => {
    const user = userEvent.setup()
    const calls = captureQuery()
    renderPage('/patrol/points?auth=9')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    await user.click(inFilters().getByLabelText('인증수단'))
    await user.click(await screen.findByRole('option', { name: '전체' }))

    await waitFor(() => expect(url()).not.toContain('auth'))
    expect(url()).not.toContain('ALL')
    await waitFor(() => expect(calls[calls.length - 1].get('authMethod')).toBeNull())
  })

  it('🔴 필터를 바꾸면 첫 페이지로 돌아간다', async () => {
    const user = userEvent.setup()
    renderPage('/patrol/points?page=3')

    await waitFor(() => expect(url()).toContain('page=3'))
    await user.click(inFilters().getByLabelText('인증수단'))
    await user.click(await screen.findByRole('option', { name: 'QR' }))

    // 3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있고 그러면 정상 응답인 빈 화면이 된다
    await waitFor(() => expect(url()).not.toContain('page=3'))
  })

  it('🔴 pageSize 는 서버 상한(100)을 넘지 않는다', async () => {
    const calls = captureQuery()
    renderPage('/patrol/points?size=500')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    expect(Number(calls[calls.length - 1].get('pageSize'))).toBeLessThanOrEqual(100)
  })

  it('🔴 검색은 순찰자만이다 — 서버가 지점명을 텍스트로 받지 않는다(OQ-037-B)', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    // 못 하는 것을 placeholder 에 적으면 입력해 보고 0건을 받는다
    expect(screen.getByPlaceholderText('순찰자 검색')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/지점명/)).not.toBeInTheDocument()
  })

  it('🔴 페이지를 넘기면 URL 과 서버 pageNumber 가 함께 움직인다 (018 T162·T163 종결)', async () => {
    const calls = captureQuery()
    renderPage('/patrol/points?page=2')

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    expect(calls[calls.length - 1].get('pageNumber')).toBe('2')
  })
})

describe('PatrolPointsPage — 실측 예외를 화면이 감당한다', () => {
  const rows = (over: Record<string, unknown> = {}) => [
    {
      detailSeq: 418,
      courseSeq: 1,
      courseName: 'A동 순찰코스',
      pointSeq: 12,
      pointName: '정문 입구',
      checkDt: '2026-05-01T09:07:00',
      userSeq: 21,
      userName: '김근무',
      authMethod: 9,
      authMethodName: 'QR',
      status: 4,
      statusName: '완료',
      overTimeYn: false,
      hasMemo: false,
      pauseTime: '00:07:00',
      ...over,
    },
  ]

  const seed = (over: Record<string, unknown> = {}) =>
    server.use(
      http.get(GET_POINT_HISTORY_PATH, () =>
        HttpResponse.json({
          message: '',
          code: 200,
          data: { items: rows(over), page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        })
      )
    )

  it('🔴 미완료 행도 인증시각을 보여주고 인증수단만 비운다 (OQ-15 해소)', async () => {
    seed({ status: 3, statusName: '미완료', authMethod: null, authMethodName: '' })
    renderPage()

    expect((await screen.findAllByText('미완료')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('09:07').length).toBeGreaterThan(0)
    expect(screen.queryByText('QR')).not.toBeInTheDocument()
  })

  it('🔴 완료 + 시간초과는 뱃지 2개로 병기한다 — 독립 축이다', async () => {
    seed({ overTimeYn: true })
    renderPage()

    expect((await screen.findAllByText('이상없음')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('시간초과').length).toBeGreaterThan(0)
  })

  it('완료인데 순찰자·인증수단이 null 인 행에서도 터지지 않는다 (OQ-16, 실측 3건)', async () => {
    seed({ userName: null, authMethod: null, authMethodName: '' })
    renderPage()

    expect((await screen.findAllByText('정문 입구')).length).toBeGreaterThan(0)
  })
})
