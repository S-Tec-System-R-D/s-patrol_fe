import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { format, subDays } from 'date-fns'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ActiveCourseSection from '@/features/dashboard/components/ActiveCourseSection'
import DashboardKpiRow from '@/features/dashboard/components/DashboardKpiRow'
import type { DashboardCourse } from '@/features/dashboard/types'
import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetNoticeStore } from '@/mocks/handlers/notices'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DashboardPage from '../DashboardPage'

/**
 * `/dashboard` — `spec 068`(API 연결). 값은 `mocks/handlers/dashboard.ts` 응답 기준.
 * 정렬 · 단계 · 기준 없음 · 경과 증가 · 최근 기록 합치기 · 영역별 오류 · 새로고침.
 */

const PATHS = {
  summary: '/api/v1/DashBoard/W/sign/GetTodaySummary',
  courses: '/api/v1/DashBoard/W/sign/GetDashboardCourseList',
  history: '/api/v1/DashBoard/W/sign/GetDashboardPointHistory',
  notice: '/api/v1/Notice/W/sign/GetNoticeList',
  finished: '/api/v1/History/W/sign/GetCourseHistory',
  sse: '/api/v1/Sse/subscribe',
}

const serverError = () => HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 })

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const captureRequests = () => {
  const calls: URL[] = []
  server.events.on('request:start', ({ request }) => calls.push(new URL(request.url)))
  return calls
}

const pagedHistory = (items: unknown[]) => ({
  message: 'ok',
  data: { items, totalCount: items.length, page: 1, pageSize: 100 },
  code: 200,
})

/** 연결을 열어 두고 알림을 보낸다 — mock 기본 핸들러는 `connected` 뿐이다 */
const liveSse = () => {
  const encoder = new TextEncoder()
  let stream: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller
      controller.enqueue(encoder.encode('event: connected\ndata: conn\n\n'))
    },
  })
  server.use(
    http.get(PATHS.sse, () => new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } }))
  )
  return (event: string, data: object) =>
    stream.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
}

const updatedAtText = () => screen.getByText('마지막 갱신', { exact: false }).textContent

const section = (heading: string) => screen.getByRole('heading', { name: heading }).closest('section')!
const courseCard = (name: string) => screen.getByRole('heading', { name }).closest('a')!

beforeEach(() => {
  resetNoticeStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  // 공지 mock 시드가 사업장 7 이다
  setSite(7, '테스트 사업장')
})

afterEach(() => {
  clearTokens()
  server.events.removeAllListeners()
})

describe('DashboardPage — API 연결', () => {
  it('선택한 사업장으로 4개 영역을 부른다 — 최근 기록은 미완료 · 시간초과 2번', async () => {
    const calls = captureRequests()
    renderPage()
    await screen.findByRole('heading', { name: 'C코스' })

    const of = (path: string) => calls.filter((url) => url.pathname === path)
    expect(of(PATHS.summary)[0].searchParams.get('siteSeq')).toBe('7')
    expect(of(PATHS.courses)[0].searchParams.get('siteSeq')).toBe('7')
    const history = of(PATHS.history).map((url) => url.searchParams)
    expect(history).toHaveLength(2)
    expect(history.map((p) => [p.get('status'), p.get('overTimeYn'), p.get('pageSize')])).toEqual([
      ['3', null, '5'],
      [null, 'true', '5'],
    ])
    expect(of(PATHS.notice)[0].searchParams.get('pageSize')).toBe('3')
  })

  it('KPI — 응답 숫자 그대로 · 묶음 2개 · 누를 수 없다', async () => {
    renderPage()
    const patrol = await screen.findByRole('region', { name: '오늘 순찰' })
    expect(within(patrol).getAllByRole('term').map((el) => el.textContent)).toEqual([
      '오늘 완료',
      '오늘 미완료',
      '시간초과',
    ])
    expect(within(patrol).getAllByRole('definition').map((el) => el.textContent)).toEqual(['12건', '1건', '2건'])
    const deploy = screen.getByRole('region', { name: '배치 대기' })
    expect(within(deploy).getAllByRole('definition').map((el) => el.textContent)).toEqual(['2건', '1건'])
    expect(patrol.closest('a')).toBeNull()
  })

  it('진행 중 카드 — 시간초과 → 경과 비율 순, 기준 없음은 맨 뒤, 회차 상세로 간다', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'C코스' })
    const cards = within(section('진행 중인 순찰')).getAllByRole('link')
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'C코스',
      'A코스',
      'B코스',
      'D코스',
      '야간코스',
      '임시코스',
    ])
    expect(cards[0]).toHaveTextContent('시간초과 +13분')
    expect(cards[0]).toHaveAttribute('href', '/patrol/zones/103')
  })

  it('카드 — 서버 status 단계 · 지금 순찰자 · 교대 · 다음 지점 · 건너뜀', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'B코스' })
    const card = courseCard('B코스')
    expect(card).toHaveTextContent('3/5 지점')
    expect(card).toHaveTextContent('김철수')
    expect(card).not.toHaveTextContent('최근무')
    expect(card).toHaveTextContent('교대')
    expect(card).toHaveTextContent('다음: 옥상')
    expect(card).toHaveTextContent('건너뜀 1')
    const steps = within(card).getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    expect(steps[2]).toHaveTextContent('3창고 (건너뜀)')
    expect(steps[4]).toHaveTextContent('5옥상 (다음)')

    const night = courseCard('야간코스')
    expect(night).toHaveTextContent('출발')
    expect(night).toHaveTextContent('0/4 지점')
    expect(night).not.toHaveTextContent('교대')
  })

  it('totalMin 0 — 기준 없음(막대 · 시간초과 없음)', async () => {
    renderPage()
    await screen.findByRole('heading', { name: '임시코스' })
    const card = courseCard('임시코스')
    expect(card).toHaveTextContent('12분 · 기준 없음')
    expect(card).not.toHaveTextContent('시간초과')
    expect(card).not.toHaveTextContent('/ 0분')
  })

  it('최근 미완료 · 시간초과 — 2번 호출을 합쳐 최근 순 5건 · 겹친 행 하나 · 완료 행은 시간초과만', async () => {
    renderPage()
    const history = await waitFor(() => {
      const el = section('최근 미완료 · 시간초과')
      expect(within(el).getAllByRole('listitem')).toHaveLength(5)
      return el
    })
    const rows = within(history).getAllByRole('listitem')
    expect(rows.map((row) => row.querySelector('.font-semibold')?.textContent)).toEqual([
      '3층',
      '창고',
      '옥상',
      '지하 주차장 B1',
      '후문',
    ])
    expect(within(rows[2]).getByText('미완료')).toBeInTheDocument()
    expect(within(rows[2]).getByText('시간초과')).toBeInTheDocument()
    expect(within(history).getByRole('link', { name: /3층/ })).toHaveAttribute('href', '/patrol/points/1000')
    expect(within(history).getByRole('link', { name: /전체 보기/ })).toHaveAttribute('href', '/patrol/points')
    expect(within(history).queryByText('이상없음')).toBeNull()
    expect(within(rows[1]).getByText('시간초과')).toBeInTheDocument()
  })

  it('공지 — 앞 3건 · 고정 공지만 핀', async () => {
    renderPage()
    const notice = await waitFor(() => {
      const el = section('공지사항')
      expect(within(el).getAllByRole('listitem')).toHaveLength(3)
      return el
    })
    expect(within(notice).getAllByLabelText('고정 공지')).toHaveLength(1)
    expect(within(notice).getByRole('link', { name: /사업장 출입 보안 수칙/ })).toHaveAttribute('href', '/notice/5')
  })

  it('진행 중 0건 — 없음 표시', async () => {
    server.use(http.get(PATHS.courses, () => HttpResponse.json({ message: 'ok', data: [], code: 200 })))
    renderPage()
    expect(await screen.findByText('지금 진행 중인 순찰이 없습니다')).toBeInTheDocument()
  })

  it('한 영역이 실패해도 나머지는 그린다 · 다시 시도하면 그 영역만 다시 받는다', async () => {
    server.use(http.get(PATHS.courses, serverError, { once: true }))
    renderPage()
    expect(await screen.findByText('진행 중인 순찰을 불러오지 못했습니다')).toBeInTheDocument()
    // KPI 는 정상
    expect(await screen.findByRole('region', { name: '오늘 순찰' })).toBeInTheDocument()

    await userEvent.click(within(section('진행 중인 순찰')).getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('heading', { name: 'C코스' })).toBeInTheDocument()
  })

  it('최근 기록 2번 중 하나만 실패해도 영역 전체가 오류다(반쪽 목록 없음)', async () => {
    server.use(
      http.get(PATHS.history, ({ request }) =>
        new URL(request.url).searchParams.get('overTimeYn') === 'true' ? serverError() : undefined
      )
    )
    renderPage()
    expect(await screen.findByText('최근 기록을 불러오지 못했습니다')).toBeInTheDocument()
    expect(within(section('최근 미완료 · 시간초과')).queryAllByRole('listitem')).toHaveLength(0)
  })

  it('KPI 실패 — 0 을 그리지 않고 오류 · 다시 시도', async () => {
    server.use(http.get(PATHS.summary, serverError))
    renderPage()
    expect(await screen.findByText('오늘 숫자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '오늘 순찰' })).toBeNull()
  })

  it('새로고침 — 5개 영역을 다시 부른다 · 30초 자동 문구 없음', async () => {
    const calls = captureRequests()
    const count = (path: string) => calls.filter((url) => url.pathname === path).length
    renderPage()
    await screen.findByRole('heading', { name: 'C코스' })
    await waitFor(() => expect(within(section('공지사항')).getAllByRole('listitem')).toHaveLength(3))
    expect(screen.queryByText(/30초마다 자동/)).toBeNull()
    // 첫 연결의 목록 다시 받기(`spec 069`)가 끝난 뒤부터 센다
    await waitFor(() => expect(count(PATHS.courses)).toBe(2))

    calls.length = 0
    await userEvent.click(screen.getByRole('button', { name: '새로고침' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '새로고침' })).toBeEnabled())
    expect([
      count(PATHS.summary),
      count(PATHS.courses),
      count(PATHS.finished),
      count(PATHS.history),
      count(PATHS.notice),
    ]).toEqual([1, 1, 1, 2, 1])
  })

  it('실시간 연결 — mock 연결이 붙으면 `실시간`', async () => {
    renderPage()
    expect(await screen.findByText('실시간')).toBeInTheDocument()
  })

  it('실시간 연결 실패 — `다시 연결 중` · 화면은 그대로 그린다', async () => {
    server.use(http.get(PATHS.sse, serverError))
    renderPage()
    await screen.findByRole('heading', { name: 'C코스' })
    expect(screen.getByText('다시 연결 중')).toBeInTheDocument()
    expect(screen.queryByText('실시간')).toBeNull()
  })
})

describe('DashboardPage — 최근 종료된 순찰', () => {
  const finishedRows = () => within(section('최근 종료된 순찰')).getAllByRole('listitem')

  it('어제~오늘 100건을 받아 오늘 끝난 회차를 종료 시각 순으로 · 회차 상세로 간다', async () => {
    const calls = captureRequests()
    renderPage()
    await screen.findByRole('link', { name: /오늘 중단 코스/ })

    const query = calls.find((url) => url.pathname === PATHS.finished)!.searchParams
    expect(query.get('pageSize')).toBe('100')
    expect(query.get('toDt')).toBe(format(new Date(), 'yyyy-MM-dd'))
    expect(query.get('fromDt')).toBe(format(subDays(new Date(), 1), 'yyyy-MM-dd'))

    const rows = finishedRows()
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('00:50')
    expect(rows[0]).toHaveTextContent('1/3 인증')
    expect(rows[0]).toHaveTextContent('미완료')
    expect(rows[1]).toHaveTextContent('오늘 완료 코스')
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/patrol/zones/191')
    expect(within(section('최근 종료된 순찰')).getByRole('link', { name: /전체 보기/ })).toHaveAttribute(
      'href',
      '/patrol/zones'
    )
  })

  it('오늘 끝난 회차가 없으면 없음 표시', async () => {
    server.use(http.get(PATHS.finished, () => HttpResponse.json(pagedHistory([]))))
    renderPage()
    expect(await screen.findByText('오늘 종료된 순찰이 없습니다')).toBeInTheDocument()
  })

  it('실패해도 나머지는 그리고 다시 시도하면 그 영역만 다시 받는다', async () => {
    server.use(http.get(PATHS.finished, serverError, { once: true }))
    renderPage()
    expect(await screen.findByText('최근 종료된 순찰을 불러오지 못했습니다')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'C코스' })).toBeInTheDocument()

    await userEvent.click(within(section('최근 종료된 순찰')).getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByRole('link', { name: /오늘 중단 코스/ })).toBeInTheDocument()
  })

  it('종료 알림 — 행이 나타나고 `마지막 갱신` 이 바뀐다', async () => {
    const send = liveSse()
    server.use(http.get(PATHS.finished, () => HttpResponse.json(pagedHistory([])), { once: true }))
    renderPage()
    await screen.findByText('오늘 종료된 순찰이 없습니다')
    await screen.findByText('실시간')
    await screen.findByRole('heading', { name: 'C코스' })
    // 표시가 초 단위라 첫 연결의 다시 받기가 끝난 뒤 1초를 넘겨 둔다
    await new Promise((resolve) => setTimeout(resolve, 1600))
    const before = updatedAtText()

    send('course-ended', { link: 'Patrol', siteSeq: 7, courseSeq: 1, historySeq: 191, endType: 'aborted' })

    expect(await screen.findByRole('link', { name: /오늘 중단 코스/ }, { timeout: 2000 })).toBeInTheDocument()
    expect(updatedAtText()).not.toBe(before)
  }, 10_000)
})

describe('ActiveCourseSection — 경과 1분 증가', () => {
  afterEach(() => vi.useRealTimers())

  const course = (overrides: Partial<DashboardCourse>): DashboardCourse => ({
    historySeq: 1,
    courseSeq: 1,
    courseName: '흐름',
    startDt: '2026-11-03T09:00:00',
    elapsedSec: 10 * 60,
    pausedYn: false,
    totalMin: 30,
    handoverCount: 0,
    users: [{ userSeq: 1, userName: '순찰자' }],
    points: [],
    ...overrides,
  })

  it('넓은 폭 — 1개면 1열 · 2개부터 2열', () => {
    const renderCards = (courses: DashboardCourse[]) =>
      render(
        <MemoryRouter>
          <ActiveCourseSection courses={courses} state="ready" receivedAt={Date.now()} onRetry={() => {}} />
        </MemoryRouter>
      )
    const one = renderCards([course({})])
    expect(one.container.querySelector('.xl\\:grid-cols-2')).toBeNull()
    one.unmount()

    const two = renderCards([course({}), course({ historySeq: 2 })])
    expect(two.container.querySelector('.xl\\:grid-cols-2')).not.toBeNull()
  })

  it('1분 뒤 경과가 늘고, 멈춘 회차는 그대로', () => {
    vi.useFakeTimers()
    const receivedAt = Date.now()
    render(
      <MemoryRouter>
        <ActiveCourseSection
          courses={[course({}), course({ historySeq: 2, courseName: '멈춤', pausedYn: true })]}
          state="ready"
          receivedAt={receivedAt}
          onRetry={() => {}}
        />
      </MemoryRouter>
    )
    expect(courseCard('흐름')).toHaveTextContent('10분 / 30분')
    expect(courseCard('멈춤')).toHaveTextContent('10분 / 30분')

    act(() => vi.advanceTimersByTime(60_000))
    expect(courseCard('흐름')).toHaveTextContent('11분 / 30분')
    expect(courseCard('멈춤')).toHaveTextContent('10분 / 30분')
  })
})

describe('DashboardKpiRow — 색', () => {
  it('값이 0 이면 색을 빼고, 있으면 미완료 · 시간초과는 danger · 배치는 point', () => {
    const zero = { completedCount: 0, incompleteCount: 0, overtimeCount: 0, pendingAssignmentCount: 0, pendingReturnCount: 0 }
    const { container, unmount } = render(<DashboardKpiRow summary={zero} state="ready" onRetry={() => {}} />)
    expect(container.querySelector('.bg-danger-bg, .bg-point-bg')).toBeNull()
    unmount()

    const filled = render(
      <DashboardKpiRow
        summary={{ ...zero, completedCount: 3, incompleteCount: 1, overtimeCount: 2, pendingReturnCount: 1 }}
        state="ready"
        onRetry={() => {}}
      />
    )
    expect(filled.container.querySelectorAll('.bg-danger-bg')).toHaveLength(2)
    expect(filled.container.querySelectorAll('.bg-point-bg')).toHaveLength(1)
  })
})
