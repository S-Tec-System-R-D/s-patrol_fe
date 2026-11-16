import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { format, subDays } from 'date-fns'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ActiveCourseSection from '@/features/dashboard/components/ActiveCourseSection'
import DashboardKpiCard from '@/features/dashboard/components/DashboardKpiCard'
import type { DashboardCourse } from '@/features/dashboard/types'
import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { resetNoticeStore } from '@/mocks/handlers/notices'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DashboardPage from '../DashboardPage'

/**
 * `/dashboard` — `spec 068`(API 연결) → `spec 073`(개편). 값은 `mocks/handlers/dashboard.ts` · `history.ts` · `deployments.ts` 기준.
 * 정렬 · 단계 · 기준 없음 · 경과 증가 · 최근 기록(회차 단위) · 배치 대기 · 영역별 오류 · 새로고침.
 */

const PATHS = {
  summary: '/api/v1/DashBoard/W/sign/GetTodaySummary',
  courses: '/api/v1/DashBoard/W/sign/GetDashboardCourseList',
  pointHistory: '/api/v1/DashBoard/W/sign/GetDashboardPointHistory',
  requests: '/api/v1/Assignment/W/sign/GetAssignmentList',
  returns: '/api/v1/Assignment/W/sign/GetAssignmentReturnList',
  notice: '/api/v1/Notice/W/sign/GetNoticeList',
  finished: '/api/v1/History/W/sign/GetCourseHistory',
  handOvers: '/api/v1/History/W/sign/GetCourseHistoryHandOvers',
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
const recentList = (name: string) => screen.getByRole('list', { name })
const courseCard = (name: string) => screen.getByRole('heading', { name }).closest('a')!

beforeEach(() => {
  resetNoticeStore()
  resetDeploymentStore()
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
  it('선택한 사업장으로 영역을 부른다 — 지점 이력(GetDashboardPointHistory)은 부르지 않는다', async () => {
    const calls = captureRequests()
    renderPage()
    await screen.findByRole('heading', { name: 'C코스' })

    const of = (path: string) => calls.filter((url) => url.pathname === path)
    expect(of(PATHS.summary)[0].searchParams.get('siteSeq')).toBe('7')
    expect(of(PATHS.courses)[0].searchParams.get('siteSeq')).toBe('7')
    expect(of(PATHS.requests)[0].searchParams.get('siteSeq')).toBe('7')
    expect(of(PATHS.returns)[0].searchParams.get('siteSeq')).toBe('7')
    expect(of(PATHS.pointHistory)).toHaveLength(0)
    expect(of(PATHS.notice)[0].searchParams.get('pageSize')).toBe('3')
  })

  it('KPI — 카드 하나 4칸 · 진행 중은 목록 개수 · 배치 숫자 없음 · 누를 수 없다', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'C코스' })
    const patrol = screen.getByRole('region', { name: '오늘 순찰' })
    expect(within(patrol).getAllByRole('term').map((el) => el.textContent)).toEqual([
      '진행 중',
      '완료',
      '미완료',
      '시간초과',
    ])
    expect(within(patrol).getAllByRole('definition').map((el) => el.textContent)).toEqual([
      '6건',
      '12건',
      '1건',
      '2건',
    ])
    expect(patrol).not.toHaveTextContent('배치')
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

  it('카드 — 서버 status 단계 · 지금 순찰자 · 교대 · 다음 지점 · 미인증(D8)', async () => {
    renderPage()
    await screen.findByRole('heading', { name: 'B코스' })
    const card = courseCard('B코스')
    expect(card).toHaveTextContent('3/5 지점')
    expect(card).toHaveTextContent('김철수')
    expect(card).not.toHaveTextContent('최근무')
    expect(card).toHaveTextContent('교대')
    expect(card).not.toHaveTextContent('다음:')
    expect(card).toHaveTextContent('미인증 1')
    const steps = within(card).getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    expect(steps[2]).toHaveTextContent('3창고 (미인증)')
    expect(steps[4]).toHaveTextContent('5옥상 (다음)')

    const night = courseCard('야간코스')
    expect(night).toHaveTextContent('출발')
    expect(night).toHaveTextContent('0/4 지점')
    expect(night).not.toHaveTextContent('교대')
  })

  it('교대 — 일어난 지점 위에 표시 · 지금 순찰자는 마지막으로 받은 사람 · 이름 옆 뱃지는 뺀다', async () => {
    const handOver = (fromUserName: string, toUserName: string, lastOrderNo: number) => ({
      fromUserSeq: 1,
      fromUserName,
      toUserSeq: 2,
      toUserName,
      lastOrderNo,
      nextOrderNo: null,
    })
    server.use(
      http.get(PATHS.handOvers, () =>
        HttpResponse.json({
          message: 'ok',
          code: 200,
          data: [handOver('김철수', '이영희', 1), handOver('이영희', '김철수', 2)],
        })
      )
    )
    renderPage()
    await screen.findByRole('heading', { name: 'B코스' })
    const card = courseCard('B코스')
    await waitFor(() => expect(within(card).getAllByRole('listitem')[0]).toHaveTextContent('교대'))

    const steps = within(card).getAllByRole('listitem')
    expect(steps[1]).toHaveTextContent('교대')
    expect(steps[2]).not.toHaveTextContent('교대')
    expect(within(card).getAllByText('교대')).toHaveLength(2)
    expect(card).toHaveTextContent('김철수')
  })

  it('totalMin 0 — 기준 없음(막대 · 시간초과 없음)', async () => {
    renderPage()
    await screen.findByRole('heading', { name: '임시코스' })
    const card = courseCard('임시코스')
    expect(card).toHaveTextContent('12분 · 기준 없음')
    expect(card).not.toHaveTextContent('시간초과')
    expect(card).not.toHaveTextContent('/ 0분')
  })

  it('최근 미완료 · 시간초과 — 회차 1건 = 1행 · 놓친 지점 이름 · 미완료 N / 시간초과', async () => {
    renderPage()
    const rows = await waitFor(() => {
      const items = within(recentList('미완료 · 시간초과')).getAllByRole('listitem')
      expect(items).toHaveLength(2)
      return items
    })
    expect(rows[0]).toHaveTextContent('오늘 중단 코스')
    expect(rows[0]).toHaveTextContent('미완료 2')
    await waitFor(() => expect(rows[0]).toHaveTextContent('놓친 지점 로비 1층, 지하 주차장 B1'))
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/patrol/zones/191')
    expect(rows[1]).toHaveTextContent('오늘 초과 코스')
    expect(rows[1]).toHaveTextContent('시간초과')
    expect(rows[1]).not.toHaveTextContent('미완료')
  })

  it('배치 대기 — 배치 요청 · 복귀 요청 묶음 · 대기 일수 · 승인하면 목록에서 빠진다', async () => {
    renderPage()
    const panel = await waitFor(() => {
      const el = section('배치 대기')
      expect(within(el).getAllByRole('listitem')).toHaveLength(3)
      return el
    })
    expect(panel).toHaveTextContent('배치 요청 2')
    expect(panel).toHaveTextContent('복귀 요청 1')
    expect(panel).toHaveTextContent('해운대 마린시티')
    expect(panel).toHaveTextContent('강서 스퀘어타워')
    expect(within(panel).getAllByText(/일 대기$/).length).toBeGreaterThan(0)
    expect(within(panel).getByRole('link', { name: /배치관리/ })).toHaveAttribute('href', '/deployments')

    await userEvent.click(within(panel).getByRole('button', { name: '최범수 승인' }))
    await waitFor(() => expect(within(section('배치 대기')).getAllByRole('listitem')).toHaveLength(2))
    expect(section('배치 대기')).not.toHaveTextContent('최범수')
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

  it('KPI 실패 — 0 을 그리지 않고 오류 · 다시 시도', async () => {
    server.use(http.get(PATHS.summary, serverError))
    renderPage()
    expect(await screen.findByText('오늘 숫자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '오늘 순찰' })).toBeNull()
  })

  it('새로고침 — 영역을 전부 다시 부른다 · 30초 자동 문구 없음', async () => {
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
      count(PATHS.requests),
      count(PATHS.returns),
      count(PATHS.notice),
    ]).toEqual([1, 1, 1, 1, 1, 1])
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
  const finishedRows = () => within(recentList('종료된 순찰')).getAllByRole('listitem')

  it('어제~오늘 100건을 받아 오늘 끝난 회차를 종료 시각 순으로 · 회차 상세로 간다', async () => {
    const calls = captureRequests()
    renderPage()
    await screen.findAllByRole('link', { name: /오늘 중단 코스/ })

    const query = calls.find((url) => url.pathname === PATHS.finished)!.searchParams
    expect(query.get('pageSize')).toBe('100')
    expect(query.get('toDt')).toBe(format(new Date(), 'yyyy-MM-dd'))
    expect(query.get('fromDt')).toBe(format(subDays(new Date(), 1), 'yyyy-MM-dd'))

    const rows = finishedRows()
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('00:50')
    expect(rows[0]).toHaveTextContent('1/3')
    expect(rows[0]).toHaveTextContent('미완료')
    expect(rows[2]).toHaveTextContent('오늘 완료 코스')
    // 예외만 뱃지 — 정상 완료 행에는 결과 뱃지가 없다
    expect(within(rows[2]).queryByText('완료')).toBeNull()
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/patrol/zones/191')
    expect(within(section('최근 기록')).getAllByRole('link', { name: /전체 보기/ })[0]).toHaveAttribute(
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
    expect((await screen.findAllByText('최근 기록을 불러오지 못했습니다')).length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { name: 'C코스' })).toBeInTheDocument()

    await userEvent.click(within(section('최근 기록')).getAllByRole('button', { name: '다시 시도' })[0])
    expect((await screen.findAllByRole('link', { name: /오늘 중단 코스/ })).length).toBeGreaterThan(0)
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

    expect((await screen.findAllByRole('link', { name: /오늘 중단 코스/ }, { timeout: 2000 })).length).toBeGreaterThan(0)
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

  it('2xl — 1개면 1열 · 2개부터 2열(xl 은 열이 절반이라 1열)', () => {
    const renderCards = (courses: DashboardCourse[]) =>
      render(
        <MemoryRouter>
          <ActiveCourseSection courses={courses} state="ready" receivedAt={Date.now()} onRetry={() => {}} />
        </MemoryRouter>
      )
    const one = renderCards([course({})])
    expect(one.container.querySelector('[class*="grid-cols-2"]')).toBeNull()
    one.unmount()

    const two = renderCards([course({}), course({ historySeq: 2 })])
    expect(two.container.querySelector('[class~="2xl:grid-cols-2"]')).not.toBeNull()
  })

  it('현재 위치 링 — 진행 중만 · 멈춘 회차는 끈다', () => {
    const points = [{ detailSeq: 1, pointSeq: 1, orderNo: 1, pointName: '정문', status: 1, checkDt: null }]
    render(
      <MemoryRouter>
        <ActiveCourseSection
          courses={[course({ points }), course({ historySeq: 2, courseName: '멈춤', pausedYn: true, points })]}
          state="ready"
          receivedAt={Date.now()}
          onRetry={() => {}}
        />
      </MemoryRouter>
    )
    expect(within(courseCard('흐름')).getByTestId('step-pulse')).toBeInTheDocument()
    expect(within(courseCard('멈춤')).queryByTestId('step-pulse')).toBeNull()
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

describe('DashboardKpiCard — 색', () => {
  const zero = { completedCount: 0, incompleteCount: 0, overtimeCount: 0, pendingAssignmentCount: 0, pendingReturnCount: 0 }

  it('0 이면 회색 · 미완료 · 시간초과만 빨강 · 진행 중을 모르면 -', () => {
    const { container, unmount } = render(
      <DashboardKpiCard summary={zero} activeCount={null} state="ready" onRetry={() => {}} />
    )
    expect(container.querySelector('.text-danger-foreground')).toBeNull()
    expect(screen.getAllByRole('definition')[0]).toHaveTextContent('-건')
    unmount()

    const filled = render(
      <DashboardKpiCard
        summary={{ ...zero, completedCount: 3, incompleteCount: 1, overtimeCount: 2 }}
        activeCount={2}
        state="ready"
        onRetry={() => {}}
      />
    )
    expect(filled.container.querySelectorAll('.text-danger-foreground')).toHaveLength(2)
  })
})
