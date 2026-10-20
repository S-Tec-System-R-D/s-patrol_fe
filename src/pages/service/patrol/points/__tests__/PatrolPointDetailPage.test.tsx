import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import PatrolPointDetailPage from '../PatrolPointDetailPage'

/**
 * `/patrol/points/:detailSeq` 지점 인증 상세 — `spec 037` Phase 4 **신설**.
 *
 * 🔴 **키가 `detailSeq`(인증 1건)** 다. 같은 지점이 하루에 여러 번 찍히므로 `pointSeq` 로
 * 열면 "어느 인증인지" 가 사라진다.
 */

const GET_DETAIL_PATH = '/api/v1/History/W/sign/GetPointHistoryDetail'

const detail = (over: Record<string, unknown> = {}) => ({
  detailSeq: 418,
  pointSeq: 12,
  pointName: '정문 입구',
  overtimeYn: false,
  hasMemo: true,
  status: 4,
  statusName: '완료',
  gpsLat: 37.4936,
  gpsLng: 127.0286,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  userSeq: 21,
  userName: '김근무',
  pauseTime: '00:07:00',
  checkDt: '2026-05-01T09:07:00',
  authMethod: 9,
  authMethodName: 'QR',
  memoList: [
    {
      memoSeq: 50,
      memo: '3층 비상등 점멸',
      attachList: [{ attachSeq: 46, attachPath: 'http://x/a.jpg', fileName: 'a.jpg' }],
    },
  ],
  ...over,
})

const seed = (over: Record<string, unknown> = {}) =>
  server.use(
    http.get(GET_DETAIL_PATH, () =>
      HttpResponse.json({ message: '', code: 200, data: detail(over) })
    )
  )

const renderPage = (entry = '/patrol/points/418') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/patrol/points" element={<div>LIST_ROUTE</div>} />
          <Route path="/patrol/points/:detailSeq" element={<PatrolPointDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '테스트 사업장')
})

afterEach(() => {
  clearTokens()
})

describe('PatrolPointDetailPage — 인증 1건', () => {
  it('제목에 지점명과 인증시각을 함께 적는다', async () => {
    seed()
    renderPage()

    // 같은 지점의 인증이 여러 건이라 지점명만으로는 어느 인증인지 사라진다
    expect(await screen.findByText('정문 입구 · 2026-05-01 09:07')).toBeInTheDocument()
  })

  it('기본 정보를 요청 1개로 채운다', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('인증 정보')).toBeInTheDocument()
    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('김근무')).toBeInTheDocument()
    expect(screen.getByText('2026-05-01 09:07:00')).toBeInTheDocument()
    expect(screen.getByText('7분')).toBeInTheDocument()
  })

  it('🔴 메모와 사진을 CheckDetailMemo 로 그린다 — 컴포넌트를 복제하지 않았다', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('3층 비상등 점멸')).toBeInTheDocument()
    // 어댑터가 `attachPath` → `imagePath` 로 옮겨야 `img` 가 뜬다(B-35)
    expect(screen.getByRole('img', { name: 'a.jpg' })).toHaveAttribute('src', 'http://x/a.jpg')
  })

  it('🔴 메모가 없으면 "불러오지 못했다" 가 아니라 "남긴 기록이 없다" 다', async () => {
    seed({ hasMemo: false, memoList: [] })
    renderPage()

    expect(await screen.findByText('남긴 기록이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByText('인증 상세를 불러오지 못했습니다')).not.toBeInTheDocument()
  })

  it('🔴 authMethodName 의 "Unknown" 을 화면에 내보내지 않는다 (B-6)', async () => {
    seed({ status: 3, statusName: '미완료', authMethod: null, authMethodName: 'Unknown' })
    renderPage()

    // 🔴 결과 뱃지는 **헤더와 인증 정보 카드 양쪽에** 있다(의도) — 복수로 받는다
    expect((await screen.findAllByText('미완료')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
  })

  it('🔴 미완료 행도 인증시각을 보여준다 (OQ-15 해소)', async () => {
    seed({ status: 3, statusName: '미완료', authMethod: null, authMethodName: 'Unknown' })
    renderPage()

    expect(await screen.findByText('2026-05-01 09:07:00')).toBeInTheDocument()
  })

  it('🔴 시간초과는 결과와 나란히 병기한다 — 상세는 소문자 t 다(B-4)', async () => {
    seed({ overtimeYn: true })
    renderPage()

    expect((await screen.findAllByText('시간초과')).length).toBeGreaterThan(0)
    // 🔴 결과는 `이상없음` 이 아니라 **`순찰기록`** 이다 — 시드가 `hasMemo: true` 고,
    //    `완료`(4)는 메모 유무로 갈린다. 시간초과는 그와 **독립 축**이라 함께 뜬다
    expect(screen.getAllByText('순찰기록').length).toBeGreaterThan(0)
  })

  it('🔴 US4 자리를 비워 두지 않는다 — historySeq 가 없어 만들 수 없는 것들', async () => {
    seed()
    renderPage()

    await screen.findByText('인증 정보')
    // 빈 카드를 두면 "데이터가 없다" 로 읽힌다(036 이 지도에서 한 판단)
    expect(screen.queryByText('직전 지점 간격')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 내 순서')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 순찰 상세')).not.toBeInTheDocument()
  })

  it('🔴 쓰기 액션을 만들지 않는다 — History/* 는 GET 8종뿐이다', async () => {
    seed()
    renderPage()

    await screen.findByText('인증 정보')
    expect(screen.queryByRole('button', { name: '확인 처리' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '기록 추가' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '원본 다운로드' })).not.toBeInTheDocument()
  })
})

describe('PatrolPointDetailPage — KPI (US3)', () => {
  it('🔴 KPI 는 2칸이다 — historySeq 가 없는 2칸을 빈 칸으로 두지 않는다', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('인증 결과')).toBeInTheDocument()
    expect(screen.getByText('최근 14일 인증')).toBeInTheDocument()
    expect(screen.queryByText('직전 지점 간격')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 내 순서')).not.toBeInTheDocument()
  })

  it('🔴 메모·사진 건수를 구성으로 적는다 — 사진은 404 여도 건수는 사실이다(B-40)', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('메모 1건 · 사진 1장')).toBeInTheDocument()
  })

  it('메모가 없으면 "남긴 기록 없음" 이다', async () => {
    seed({ hasMemo: false, memoList: [] })
    renderPage()

    expect(await screen.findByText('남긴 기록 없음')).toBeInTheDocument()
  })
})

describe('PatrolPointDetailPage — 못 찾았을 때', () => {
  it('🔴 "삭제되었다" 고 단정하지 않고 복귀 수단을 준다', async () => {
    server.use(http.get(GET_DETAIL_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderPage()

    expect(await screen.findByText('인증 상세를 불러오지 못했습니다')).toBeInTheDocument()
    // 조회 중에 "삭제되었다" 가 뜨면 사용자는 방금 지운 줄 안다(023 T375 선례)
    expect(screen.queryByText(/삭제/)).not.toBeInTheDocument()
    expect(screen.getByText('순찰이력 목록으로')).toBeInTheDocument()
  })

  it('🔴 detailSeq 가 숫자가 아니면 요청하지 않는다 — 주소가 잘못된 것이다', async () => {
    const calls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname === GET_DETAIL_PATH) calls.push(request.url)
    })
    renderPage('/patrol/points/abc')

    expect(await screen.findByText('인증 상세를 불러오지 못했습니다')).toBeInTheDocument()
    // 서버 400 을 기다릴 이유가 없다. 🔴 "다시 시도" 도 주지 않는다(같은 주소로 또 실패한다)
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(calls).toHaveLength(0)
    server.events.removeAllListeners()
  })
})
