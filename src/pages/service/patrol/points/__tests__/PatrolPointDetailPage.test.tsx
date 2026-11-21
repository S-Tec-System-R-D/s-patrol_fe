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

/** 🔴 제목이 뜨면 상세가 도착한 것이다 — 순찰 상세(036)와 같은 머리(`spec 050`) */
const waitDetail = () => screen.findByRole('heading', { level: 1, name: '정문 입구' })

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '테스트 사업장')
})

afterEach(() => {
  clearTokens()
})

describe('PatrolPointDetailPage — 인증 1건', () => {
  it('🔴 머리 — 지점명 + 부제(순찰자 · 시각 · 수단) + 지점 상세 (spec 078)', async () => {
    seed()
    renderPage()

    await waitDetail()
    expect(screen.getByText('김근무 · 05.01 (금) 09:07 · QR')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /지점 상세$/ })).toHaveAttribute('href', '/points/12')
    // 🔴 지점명은 제목에서만 — 인증 정보 카드에 `순찰지점` 행이 없다
    expect(screen.getAllByText('정문 입구')).toHaveLength(1)
    expect(screen.queryByText('순찰지점')).not.toBeInTheDocument()
  })

  it('인증 정보 카드는 4행 — 🔴 구간은 뺐다 (spec 078 D2)', async () => {
    seed()
    renderPage()

    await waitDetail()
    expect(screen.getByText('인증 정보')).toBeInTheDocument()
    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    // 인증 정보 카드 + 메모 머리 — 메모 머리는 이름만 적는다(`spec 070`). 부제는 한 줄 글이라 따로다
    expect(screen.getAllByText('김근무')).toHaveLength(2)
    // 🔴 초를 버리지 않는다 — 같은 분에 연달아 찍힌 인증을 가르는 값이다(OQ-15)
    expect(screen.getByText('2026-05-01 09:07:00')).toBeInTheDocument()
    expect(screen.getByText('인증수단')).toBeInTheDocument()
    // 🔴 `pauseTime` 의 뜻이 확정되지 않았고(OQ-037-A) 시안의 `이전 지점에서` 도 근거가 없다 — 뺐다
    expect(screen.queryByText('구간')).not.toBeInTheDocument()
    expect(screen.queryByText(/이전 지점에서/)).not.toBeInTheDocument()
    // 🔴 회차 번호가 없어 `순찰 회차` 링크를 만들 수 없다(037 US4)
    expect(screen.queryByText('순찰 회차')).not.toBeInTheDocument()
  })

  it('🔴 목업에 있지만 근거가 없는 3가지를 만들지 않는다', async () => {
    seed()
    renderPage()

    await waitDetail()
    // 오차·수신감도 필드가 서버에 없다 / ±5분 규칙을 모른다 / 첨부 URL 은 404 다(B-40)
    expect(screen.queryByText(/오차|수신감도/)).not.toBeInTheDocument()
    expect(screen.queryByText(/±5분|5분 이내/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '원본 다운로드' })).not.toBeInTheDocument()
  })

  it('🔴 메모와 사진을 CheckDetailMemo 로 그린다 — 컴포넌트를 복제하지 않았다', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('3층 비상등 점멸')).toBeInTheDocument()
    // 어댑터가 `attachPath` → `imagePath` 로 옮겨야 `img` 가 뜬다(B-35)
    expect(screen.getByRole('img', { name: 'a.jpg' })).toHaveAttribute('src', 'http://x/a.jpg')
  })

  it('🔴 메모는 배열이다 — 2건이 오면 둘 다 그리고 건수도 따라간다', async () => {
    seed({
      memoList: [
        { memoSeq: 50, memo: '3층 비상등 점멸', attachList: [] },
        {
          memoSeq: 51,
          memo: '[누수] 지하 주차장 천장',
          attachList: [{ attachSeq: 47, attachPath: 'http://x/b.jpg', fileName: 'b.jpg' }],
        },
      ],
    })
    renderPage()

    expect(await screen.findByText('3층 비상등 점멸')).toBeInTheDocument()
    expect(screen.getByText('[누수] 지하 주차장 천장')).toBeInTheDocument()
    expect(screen.getByText('메모 2건 · 사진 1장')).toBeInTheDocument()
  })

  it('🔄 메모가 없어도 왼쪽은 순찰 기록이다 — 빈 상태를 그린다 (사용자 결정 2026-11-21 · spec 078 의 "지도가 본문" 을 뒤집었다)', async () => {
    seed({ hasMemo: false, memoList: [] })
    renderPage()

    await waitDetail()
    expect(screen.getByText('순찰 기록')).toBeInTheDocument()
    expect(screen.getByText('남긴 기록이 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '인증 위치' })).toBeInTheDocument()
  })

  it('🔴 최근 14일 한 줄을 두지 않는다 — 머리 `지점 상세` 와 겹친다 (spec 078 D6)', async () => {
    seed()
    renderPage()

    await waitDetail()
    expect(screen.queryByRole('region', { name: '이 지점 최근 14일' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /지점 상세에서 보기/ })).not.toBeInTheDocument()
  })

  it('🔴 authMethodName 의 "Unknown" 을 화면에 내보내지 않는다 (B-6)', async () => {
    seed({ status: 3, statusName: '미완료', authMethod: null, authMethodName: 'Unknown' })
    renderPage()

    expect(await screen.findByText('미인증')).toBeInTheDocument()
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
    // 🔄 spec 078 D7 — `-` 대신 이유를 적는다(찍지 않았으니 수단이 없는 게 맞다)
    expect(screen.getByText('인증하지 않음')).toBeInTheDocument()
  })

  it('🔴 완료인데 수단이 없으면 `-` — 값이 빠진 것이라 `인증하지 않음` 이 아니다 (spec 078 D7)', async () => {
    seed({ authMethod: null, authMethodName: 'Unknown' })
    renderPage()

    await waitDetail()
    expect(screen.queryByText('인증하지 않음')).not.toBeInTheDocument()
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
  })

  it('🔴 미완료 행도 인증시각을 보여준다 (OQ-15 해소)', async () => {
    seed({ status: 3, statusName: '미완료', authMethod: null, authMethodName: 'Unknown' })
    renderPage()

    await waitDetail()
    expect(screen.getByText('2026-05-01 09:07:00')).toBeInTheDocument()
  })

  it('🔴 시간초과는 결과와 나란히 병기한다 — 상세는 소문자 t 다(B-4)', async () => {
    seed({ overtimeYn: true })
    renderPage()

    expect(await screen.findByText('시간초과')).toBeInTheDocument()
    // 🔄 spec 078 D3 — 결과(`인증`)와 `특이사항` 을 나눠 적는다(목록의 `순찰기록` 대신). 시간초과는 독립 축
    expect(screen.getByText('인증')).toBeInTheDocument()
    expect(screen.getByText('특이사항')).toBeInTheDocument()
    expect(screen.queryByText('순찰기록')).not.toBeInTheDocument()
  })

  it('🔴 US4 자리를 비워 두지 않는다 — historySeq 가 없어 만들 수 없는 것들', async () => {
    seed()
    renderPage()

    await waitDetail()
    // 빈 카드를 두면 "데이터가 없다" 로 읽힌다(036 이 지도에서 한 판단)
    expect(screen.queryByText('직전 지점 간격')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 내 순서')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 순찰 상세')).not.toBeInTheDocument()
  })

  it('🔴 쓰기 액션을 만들지 않는다 — History/* 는 GET 8종뿐이다', async () => {
    seed()
    renderPage()

    await waitDetail()
    expect(screen.queryByRole('button', { name: '확인 처리' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '기록 추가' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '원본 다운로드' })).not.toBeInTheDocument()
  })
})

describe('PatrolPointDetailPage — KPI 섹션을 두지 않는다 (2026-10-20)', () => {
  /**
   * 🔴 **KPI 행을 제거했다**(사용자 판단 2026-10-20). 인증 1건 상세는 **집계 단위가
   * 아니다** — 레코드 하나라 요약할 값이 없고, 남은 2칸은 전부 다른 영역의 재진술이었다:
   * 결과는 헤더 뱃지가(= 반복), 14일 집계는 최근 인증 카드가
   * **문자열까지 똑같이** 말하고 있었다.
   *
   * ⚠️ 목업 `04` 의 KPI 4칸은 **회차 맥락 2칸**(직전 지점 간격·코스 내 순서)이 있어야
   * 성립하는 구성이었고, 그 둘은 `historySeq` 로 막혀 있다 → 회신 후 US4 와 함께 다시 본다.
   */
  it('🔴 결과를 세 번 적지 않는다 — KPI 칸이 없다', async () => {
    seed()
    renderPage()

    await waitDetail()
    // 🔴 결과는 **제목 옆 뱃지**에서만 말한다(`spec 050` — 인증 정보 카드에 결과 행이 없다)
    expect(screen.getAllByText('인증')).toHaveLength(1)
    expect(screen.queryByText('결과')).not.toBeInTheDocument()
    expect(screen.queryByText('인증 결과')).not.toBeInTheDocument()
    expect(screen.queryByText('최근 14일 인증')).not.toBeInTheDocument()
  })

  it('KPI 가 하던 건수는 순찰 기록 카드 제목이 받았다 — 정보 손실 0', async () => {
    seed()
    renderPage()

    // 🔴 사진은 404 여도 **건수는 사실**이다(B-40) — 숨기면 "사진이 없다" 로 읽힌다
    expect(await screen.findByText('메모 1건 · 사진 1장')).toBeInTheDocument()
  })

  it('기록이 없으면 건수를 적지 않는다 — "메모 0건" 은 정보가 없다', async () => {
    seed({ hasMemo: false, memoList: [] })
    renderPage()

    await waitDetail()
    expect(screen.queryByText(/메모 0건/)).not.toBeInTheDocument()
  })
})

describe('PatrolPointDetailPage — 인증 위치 지도 (2026-10-20)', () => {
  it('🔄 메모가 없어도 지도는 오른쪽 그대로다 — 제목 옆에 좌표 (사용자 결정 2026-11-21)', async () => {
    seed({ hasMemo: false, memoList: [] })
    renderPage()

    expect(await screen.findByRole('heading', { name: '인증 위치' })).toBeInTheDocument()
    expect(screen.getByText('인증 시점 좌표 · 37.4936, 127.0286')).toBeInTheDocument()
  })

  it('🔄 메모가 있으면 지도는 오른쪽 단의 `인증 위치` 영역 — 제목 옆에 좌표 한 줄 (spec 078 → spec 084: 인증 정보 아래 · 제목이 생겼다)', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('인증 시점 좌표 · 37.4936, 127.0286')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '인증 위치' })).toBeInTheDocument()
  })

  it('🔴 좌표가 없으면 오른쪽에 지도 자리를 두고 안내한다 — 메모는 왼쪽 그대로 (spec 078 D5)', async () => {
    seed({ gpsLat: null, gpsLng: null })
    renderPage()

    await waitDetail()
    expect(screen.getByText('인증 시점 좌표가 없습니다')).toBeInTheDocument()
    expect(screen.getByText('3층 비상등 점멸')).toBeInTheDocument()
    // 🔄 `spec 084`: 좌표가 없어도 영역 제목은 있다 — 자리가 무엇인지 말한다
    expect(screen.getByRole('heading', { name: '인증 위치' })).toBeInTheDocument()
  })

  it('🔴 메모 · 좌표 둘 다 없으면 왼쪽 순찰 기록 빈 상태 + 오른쪽 좌표 없음 (spec 078 D5)', async () => {
    seed({ status: 3, statusName: '미완료', hasMemo: false, memoList: [], gpsLat: null, gpsLng: null })
    renderPage()

    await waitDetail()
    expect(screen.getByText('남긴 기록이 없습니다')).toBeInTheDocument()
    // 🔄 D7 — 미인증은 찍지 않아 위치가 없는 게 맞다(완료인데 좌표 없음과 문구를 나눈다)
    expect(screen.getByText('인증하지 않아 위치가 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('인증 시점 좌표가 없습니다')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '인증 위치' })).toBeInTheDocument()
  })

  it('🔴 범위 밖 좌표는 좌표 없음과 같이 다룬다 (B-33 — gpsLat: 123 이 실재한다)', async () => {
    seed({ gpsLat: 123, gpsLng: 57.22 })
    renderPage()

    await waitDetail()
    expect(screen.getByText('인증 시점 좌표가 없습니다')).toBeInTheDocument()
    expect(screen.queryByText(/인증 시점 좌표 ·/)).not.toBeInTheDocument()
  })

  it('🔴 거리·오차를 판정하지 않는다 — 좌표는 앱이 채우는 값이다(spec 035 P3)', async () => {
    seed({ hasMemo: false, memoList: [] })
    renderPage()

    await screen.findByText('인증 위치')
    expect(screen.queryByText(/m 벗어|오차|이탈/)).not.toBeInTheDocument()
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
