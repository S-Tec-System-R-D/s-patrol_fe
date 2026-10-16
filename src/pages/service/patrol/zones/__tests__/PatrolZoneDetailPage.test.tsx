import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
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

const renderPage = (historySeq: number) => {
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

const inCheckTable = () => within(screen.getByRole('table'))

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => clearTokens())

describe('PatrolZoneDetailPage — 회차 상세', () => {
  it('헤더·KPI·인증 내역·순찰 정보를 조립한다', async () => {
    renderPage(101)

    expect(await screen.findByText(/A동 순찰코스 ·/)).toBeInTheDocument()
    // ⚠️ `지점 인증`·`소요시간` 은 **KPI 와 순찰 정보 양쪽에** 있다(목업 `02` 도 그렇다) —
    //    KPI 는 구성을 보여주고 정보 카드는 값을 적는다
    expect(screen.getAllByText('지점 인증').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('소요시간').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('특이사항')).toBeInTheDocument()
    expect(screen.getByText('구간 평균 간격')).toBeInTheDocument()
    expect(screen.getByText('지점 인증 내역')).toBeInTheDocument()
    expect(screen.getByText('순찰 정보')).toBeInTheDocument()
  })

  it('🔴 미완료를 두 종류로 구분한다 — 미인증(무방문) ↔ 미완료(인증 실패)', async () => {
    renderPage(103)

    // 103 시드: 무방문 1건(비상구 A) + 방문했으나 인증 실패 1건(로비 1층)
    expect(await screen.findByText('비상구 A')).toBeInTheDocument()
    expect(inCheckTable().getByText('미인증')).toBeInTheDocument()
    expect(inCheckTable().getByText('미완료')).toBeInTheDocument()
  })

  it('🔴 미완료 행의 checkDt 를 인증 시각으로 보여주지 않는다 (OQ-15)', async () => {
    renderPage(103)

    await screen.findByText('로비 1층')
    // 시드의 미완료 행은 checkDt 가 있지만 authMethod 는 null 이다.
    // 의미가 확정되지 않아(코스 endDt 와 같은 것 12건 / 다른 것 33건) 숨긴다
    const row = inCheckTable().getByText('로비 1층').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getAllByText('-').length).toBeGreaterThan(0)
  })

  it('🔴 전 필드가 null 인 행(대기중·진행중)에서 터지지 않는다', async () => {
    renderPage(107)

    // 107 시드: status 0·1 이 checkDt·authMethod·좌표·순찰자·overtimeYn 전부 null
    expect(await screen.findByText('대기중')).toBeInTheDocument()
    expect(inCheckTable().getByText('진행중')).toBeInTheDocument()
  })

  it('🔴 "기준 충족" 판정을 하지 않는다 — 값만 나란히 적는다', async () => {
    renderPage(101)

    await screen.findByText(/A동 순찰코스 ·/)
    // totalMin 이 검증되지 않고(B-31) 어긋난 데이터가 전수 18건이다
    expect(screen.queryByText(/충족/)).not.toBeInTheDocument()
    expect(screen.queryByText(/초과 달성/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/기준 45분/).length).toBeGreaterThan(0)
  })

  it('🔴 totalMin 이 0 이면 "기준 0분" 이 아니라 "기준 미설정" 이다', async () => {
    renderPage(104)

    // 설정이 안 된 것과 0분은 다르다
    expect((await screen.findAllByText(/기준 미설정/)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/기준 0분/)).not.toBeInTheDocument()
  })

  it('인증수단 집계를 CheckDetails 에서 센다 — 요청은 늘지 않는다', async () => {
    renderPage(101)

    // 101 시드: NFC 2 + QR 1
    expect(await screen.findByText('QR 1 · NFC 2')).toBeInTheDocument()
  })

  it('🔴 인증 행이 0건인 회차도 실패가 아니라 사실로 그린다', async () => {
    server.use(http.get(CHECK_DETAILS_PATH, () => HttpResponse.json({ message: 'ok', code: 200, data: [] })))
    renderPage(105)

    // 완료인데 checkedCount 0 인 이력이 실재한다
    expect(await screen.findByText('인증 내역이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('인증 내역을 불러오지 못했습니다')).not.toBeInTheDocument()
  })

  it('🔴 인증 내역 조회 실패와 0건을 다르게 그린다', async () => {
    server.use(http.get(CHECK_DETAILS_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderPage(101)

    expect(await screen.findByText('인증 내역을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('인증 내역이 없습니다.')).not.toBeInTheDocument()
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

  it('🔴 순서는 orderNo 를 그대로 쓴다 — 배열 위치로 다시 매기지 않는다', async () => {
    renderPage(101)

    await screen.findByText('정문 입구')
    const first = inCheckTable().getByText('정문 입구').closest('tr')
    // 같은 지점을 화면마다 다른 번호로 부르지 않는다(032 선례)
    expect(within(first as HTMLElement).getByText('1')).toBeInTheDocument()
  })
})
