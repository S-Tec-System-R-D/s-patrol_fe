import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import PatrolZoneDetailPage from '../PatrolZoneDetailPage'
import { server } from '@/mocks/server'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/patrol/zones/:historySeq` 회차 상세 — `spec 036` Phase 4.
 *
 * 🔴 **실측 예외가 화면을 깨지 않는지**가 핵심이다. mock 시드에 심어 둔 것들:
 * - `101` 정상 3건 / `103` **미인증(무방문) + 미완료(방문)** 혼재 / `104` 메모·첨부·초과 +
 *   좌표 없는 행 / `107` **`대기중`·`진행중` 이 전 필드 `null`**
 */

const CHECK_DETAILS_PATH = '/api/v1/History/W/sign/GetCourseHistoryCheckDetails'
const HISTORY_DETAIL_PATH = '/api/v1/History/W/sign/GetCourseHistoryDetail'

const renderPage = (historySeq: number | string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/patrol/zones/${historySeq}`]}>
        <Routes>
          <Route path="/patrol/zones/:historySeq" element={<PatrolZoneDetailPage />} />
          <Route path="/patrol/zones" element={<div>LIST_ROUTE</div>} />
          <Route path="/zones/:courseSeq" element={<div>COURSE_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const inTimeline = () => within(screen.getByRole('list', { name: '지점 인증 내역' }))

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => clearTokens())

describe('PatrolZoneDetailPage — 회차 상세 (spec 077)', () => {
  it('머리(순찰자) · 요약 4칸 · 수행 타임라인 · 코스 경로를 조립한다', async () => {
    renderPage(101)

    expect(await screen.findByRole('heading', { name: 'A동 순찰코스' })).toBeInTheDocument()
    const summary = within(screen.getByRole('region', { name: '순찰 요약' }))
    for (const label of ['시작', '종료', '소요시간', '특이사항']) {
      expect(summary.getByText(label)).toBeInTheDocument()
    }
    expect(await screen.findByText('수행 타임라인')).toBeInTheDocument()
    expect(screen.getByText('순찰 시작')).toBeInTheDocument()
    expect(screen.getByText('순찰 종료')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /코스 상세/ })).toHaveAttribute('href', '/zones/1')
    // 🔴 036 의 순찰 정보 카드 · 7칸 표 · 평균 소요는 없다
    expect(screen.queryByText('순찰 정보')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByText(/평균/)).not.toBeInTheDocument()
  })

  it('🔴 미완료(3)는 시각 유무와 상관없이 미인증 하나다 (spec 079 D8)', async () => {
    renderPage(103)

    // 103 시드: 시각 없음 1건(비상구 A) + 시각 있음 1건(로비 1층) — 둘 다 미인증
    await screen.findByRole('list', { name: '지점 인증 내역' })
    expect(inTimeline().getByText('비상구 A')).toBeInTheDocument()
    // 행마다 뱃지 + 화면 낭독용 글자가 함께 있어 2행이면 2개 이상
    expect(inTimeline().getAllByText('미인증').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/건너뜀/)).not.toBeInTheDocument()
  })

  it('🔴 정상 인증(이상없음)은 뱃지를 달지 않는다 (D2)', async () => {
    renderPage(101)

    await screen.findByRole('list', { name: '지점 인증 내역' })
    // 화면 낭독기용 글자는 남는다 — 눈에 보이는 뱃지만 없다
    expect(inTimeline().queryAllByText('이상없음').every((el) => el.classList.contains('sr-only'))).toBe(true)
  })

  it('🔴 전 필드가 null 인 행(대기중·진행중)에서 터지지 않는다', async () => {
    renderPage(107)

    await screen.findByRole('list', { name: '지점 인증 내역' })
    expect(inTimeline().getAllByText('대기').length).toBeGreaterThan(0)
  })

  it('🔴 "기준 충족" 판정을 하지 않는다 — 값만 나란히 적는다', async () => {
    renderPage(101)

    await screen.findByRole('heading', { name: 'A동 순찰코스' })
    expect(screen.queryByText(/충족/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/기준 45분/).length).toBeGreaterThan(0)
  })

  it('🔴 totalMin 이 0 이면 "기준 0분" 이 아니라 "기준 미설정" 이다', async () => {
    renderPage(104)

    expect((await screen.findAllByText(/기준 미설정/)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/기준 0분/)).not.toBeInTheDocument()
  })

  it('🔴 특이사항은 글자만 — 누르는 동작이 없다 (2026-11-13)', async () => {
    renderPage(104)

    const summary = within(await screen.findByRole('region', { name: '순찰 요약' }))
    expect(await summary.findByText(/\d+건/)).toBeInTheDocument()
    expect(summary.queryByRole('button')).not.toBeInTheDocument()
  })

  it('🔴 머리 숫자는 아래 행에서 센다 — 103: 인증 1 / 3 · 미인증 2 (2026-11-13 · D8)', async () => {
    renderPage(103)

    await screen.findByRole('list', { name: '지점 인증 내역' })
    expect(screen.getByText('/ 3 인증', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('미인증 2')).toBeInTheDocument()
  })

  it('지점 줄을 누르면 고른 상태가 된다 — 지도와 서로 강조 (D3)', async () => {
    const user = userEvent.setup()
    renderPage(101)

    const button = await screen.findByRole('button', { name: /정문 입구 지도에서 보기/ })
    await user.click(button)

    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('🔴 인증 행이 0건인 회차도 실패가 아니라 사실로 그린다', async () => {
    server.use(http.get(CHECK_DETAILS_PATH, () => HttpResponse.json({ message: 'ok', code: 200, data: [] })))
    renderPage(105)

    // 완료인데 checkedCount 0 인 이력이 실재한다
    expect(await screen.findByText('이 회차에는 기록된 지점 인증이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('인증 내역을 불러오지 못했습니다')).not.toBeInTheDocument()
  })

  it('🔴 인증 내역 조회 실패와 0건을 다르게 그린다', async () => {
    server.use(http.get(CHECK_DETAILS_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderPage(101)

    expect(await screen.findByText('인증 내역을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('이 회차에는 기록된 지점 인증이 없습니다.')).not.toBeInTheDocument()
  })

  it('🔴 없는 회차를 "삭제됐다" 로 단정하지 않고 복귀 수단을 준다', async () => {
    server.use(
      http.get(HISTORY_DETAIL_PATH, () =>
        HttpResponse.json({ message: '해당 순찰 이력을 찾을 수 없습니다.', data: null, code: 400 }, { status: 400 })
      )
    )
    renderPage(9999)

    expect(await screen.findByText('순찰 상세를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText('순찰이력 목록으로')).toBeInTheDocument()
    expect(screen.queryByText(/삭제/)).not.toBeInTheDocument()
  })

  /**
   * 🔴 **`spec 037` Phase 4 에서 발견한 결함**이다. 036 은 `historySeq` 가 숫자가 아닐 때를
   * 막지 않아 **로딩 스켈레톤이 끝까지 남았다** — 쿼리가 `enabled: false` 라 영원히
   * `isPending` 이고, 사용자는 "느리다" 고 읽고 기다리는데 요청은 나가지도 않았다.
   * `spec 023`·`spec 027` 은 `&& seq !== null` 로 이미 막아 둔 자리였다.
   */
  it('🔴 historySeq 가 숫자가 아니면 로딩이 아니라 주소 오류를 보여준다', async () => {
    const calls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname === HISTORY_DETAIL_PATH) calls.push(request.url)
    })
    renderPage('abc')

    expect(await screen.findByText('순찰 상세를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText('주소가 올바르지 않습니다. 목록에서 다시 선택해주세요.')).toBeInTheDocument()
    // 🔴 "다시 시도" 를 주지 않는다 — 같은 주소로 또 실패한다
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(screen.getByText('순찰이력 목록으로')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
    server.events.removeAllListeners()
  })

  it('🔴 순서는 orderNo 를 그대로 쓴다 — 배열 위치로 다시 매기지 않는다', async () => {
    renderPage(101)

    await screen.findByRole('list', { name: '지점 인증 내역' })
    const first = inTimeline().getAllByRole('listitem')[0]
    // 같은 지점을 화면마다 다른 번호로 부르지 않는다(032 선례)
    expect(within(first).getByText('정문 입구')).toBeInTheDocument()
    expect(within(first).getByText('1')).toBeInTheDocument()
  })
})
