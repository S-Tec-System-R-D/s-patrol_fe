import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
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

/**
 * 🔴 **요약은 DOM 에 두 벌이다**(`spec 030` 과 같은 구조) — 넓은 폭 **가로 스트립**과
 * 좁은 폭 **kv 카드**를 함께 렌더하고 CSS 로 숨긴다. jsdom 에는 스타일시트가 없어
 * **둘 다 조회되므로** 단언은 영역을 좁힌다.
 */
const inSummary = () => within(screen.getByRole('group', { name: '인증 요약' }))

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '테스트 사업장')
})

afterEach(() => {
  clearTokens()
})

describe('PatrolPointDetailPage — 인증 1건', () => {
  it('🔴 페이지 타이틀 줄을 두지 않는다 — 스트립이 같은 말을 이미 한다', async () => {
    seed()
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
    // 지점명·인증시각·결과가 스트립에 있어 제목이 반복이었다(사용자 요청 2026-10-20)
    expect(screen.queryByText('정문 입구 · 2026-05-01 09:07')).not.toBeInTheDocument()
    expect(screen.queryByText('이 인증 1건의 수행 내역입니다')).not.toBeInTheDocument()
  })

  it('요약 스트립이 값 7개를 요청 1개로 채운다', async () => {
    seed()
    renderPage()

    expect(await screen.findByRole('group', { name: '인증 요약' })).toBeInTheDocument()
    expect(inSummary().getByText('정문 입구')).toBeInTheDocument()
    expect(inSummary().getByText('A동 순찰코스')).toBeInTheDocument()
    expect(inSummary().getByText('김근무')).toBeInTheDocument()
    // 🔴 **날짜와 시각이 두 줄이다** — 한 줄이면 칸 폭에서 말줄임돼 **초가 잘린다**
    //    (캡쳐에서 발견 2026-10-20). 초는 같은 분에 연달아 찍힌 인증을 가르는 값이다
    expect(inSummary().getByText('2026-05-01')).toBeInTheDocument()
    expect(inSummary().getByText('09:07:00')).toBeInTheDocument()
    // 🔴 `인증수단 · 구간` 을 한 칸에 합치지 않는다 — 구간은 의미 미확정이라(OQ-037-A)
    //    인증수단 옆에 붙이면 그 부속처럼 읽힌다
    expect(inSummary().getByText('인증수단')).toBeInTheDocument()
    expect(inSummary().getByText('구간')).toBeInTheDocument()
    expect(inSummary().getByText('7분')).toBeInTheDocument()
  })

  it('🔴 좁은 폭에서는 이전 kv 카드로 떨어진다 (사용자 결정 2026-10-20)', async () => {
    seed()
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
    // 스트립을 2·4칸으로 접으면 라벨과 값이 격자 안에서 끊겨 어디까지가 한 값인지 흐려진다
    // → `xl` 미만은 전에 쓰던 세로 kv 카드(`AppDetailCard`) 모양이다
    expect(screen.getByText('인증 정보')).toBeInTheDocument()
    // 🔴 값은 한 번만 만든다 — 두 벌이 같은 값을 그린다
    expect(screen.getAllByText('정문 입구')).toHaveLength(2)
  })

  it('🔴 목업에 있지만 근거가 없는 3가지를 만들지 않는다', async () => {
    seed()
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
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

    await screen.findByRole('group', { name: '인증 요약' })
    // 🔴 **날짜와 시각이 두 줄이다** — 한 줄이면 칸 폭에서 말줄임돼 **초가 잘린다**
    //    (캡쳐에서 발견 2026-10-20). 초는 같은 분에 연달아 찍힌 인증을 가르는 값이다
    expect(inSummary().getByText('2026-05-01')).toBeInTheDocument()
    expect(inSummary().getByText('09:07:00')).toBeInTheDocument()
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

    await screen.findByRole('group', { name: '인증 요약' })
    // 빈 카드를 두면 "데이터가 없다" 로 읽힌다(036 이 지도에서 한 판단)
    expect(screen.queryByText('직전 지점 간격')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 내 순서')).not.toBeInTheDocument()
    expect(screen.queryByText('코스 순찰 상세')).not.toBeInTheDocument()
  })

  it('🔴 쓰기 액션을 만들지 않는다 — History/* 는 GET 8종뿐이다', async () => {
    seed()
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
    expect(screen.queryByRole('button', { name: '확인 처리' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '기록 추가' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '원본 다운로드' })).not.toBeInTheDocument()
  })
})

describe('PatrolPointDetailPage — KPI 섹션을 두지 않는다 (2026-10-20)', () => {
  /**
   * 🔴 **KPI 행을 제거했다**(사용자 판단 2026-10-20). 인증 1건 상세는 **집계 단위가
   * 아니다** — 레코드 하나라 요약할 값이 없고, 남은 2칸은 전부 다른 영역의 재진술이었다:
   * 결과는 헤더 뱃지·인증 정보 카드가(= **세 번째 반복**), 14일 집계는 최근 인증 카드가
   * **문자열까지 똑같이** 말하고 있었다.
   *
   * ⚠️ 목업 `04` 의 KPI 4칸은 **회차 맥락 2칸**(직전 지점 간격·코스 내 순서)이 있어야
   * 성립하는 구성이었고, 그 둘은 `historySeq` 로 막혀 있다 → 회신 후 US4 와 함께 다시 본다.
   */
  it('🔴 결과를 세 번 적지 않는다 — KPI 칸이 없다', async () => {
    seed()
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
    // 🔴 결과는 **스트립 끝 한 칸**에서만 말한다(전에는 헤더 뱃지 + kv 행 + KPI 였다).
    //    ⚠️ 시드가 `hasMemo: true` 라 `완료`(4)는 `순찰기록` 으로 갈린다
    expect(inSummary().getAllByText('순찰기록')).toHaveLength(1)
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

    await screen.findByText('남긴 기록이 없습니다.')
    expect(screen.queryByText(/메모 0건/)).not.toBeInTheDocument()
  })
})

describe('PatrolPointDetailPage — 인증 위치 지도 (2026-10-20)', () => {
  it('좌표가 있으면 인증 정보 아래에 지도를 그린다', async () => {
    seed()
    renderPage()

    expect(await screen.findByText('인증 위치')).toBeInTheDocument()
    expect(screen.getByText('인증 시점 좌표')).toBeInTheDocument()
  })

  it('🔴 좌표가 없으면 카드 자체가 없다 — 미완료 인증은 좌표가 구조적으로 null 이다', async () => {
    seed({ status: 3, statusName: '미완료', gpsLat: null, gpsLng: null })
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
    // "표시할 좌표가 없습니다" 박스를 띄우면 미완료마다 뜨는 안내가 된다(자리만 먹는다)
    expect(screen.queryByText('인증 위치')).not.toBeInTheDocument()
  })

  it('🔴 범위 밖 좌표는 좌표 없음과 같이 다룬다 (B-33 — gpsLat: 123 이 실재한다)', async () => {
    seed({ gpsLat: 123, gpsLng: 57.22 })
    renderPage()

    await screen.findByRole('group', { name: '인증 요약' })
    expect(screen.queryByText('인증 위치')).not.toBeInTheDocument()
  })

  it('🔴 거리·오차를 판정하지 않는다 — 좌표는 앱이 채우는 값이다(spec 035 P3)', async () => {
    seed()
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
