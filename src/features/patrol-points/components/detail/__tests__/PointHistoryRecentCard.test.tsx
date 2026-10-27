import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { PointHistoryDetail, PointHistoryRow } from '@/features/course-history/types'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import PointHistoryRecentCard from '../PointHistoryRecentCard'

/**
 * 이 지점의 최근 인증 (`spec 037` Phase 5, US3).
 *
 * 🔴 **집계 자체는 여기서 테스트하지 않는다** — `summarizePatrolHistory` 는 `spec 027` 의
 * 함수이고 `patrolSummary.test.ts` 가 버킷·분모·기간 밖·미완료 제외를 이미 고정했다.
 * 이 파일은 **카드가 그 결과를 어떻게 쓰는지**(강조 · 분모 표기 · 기간 밖 안내 · 실패 분기)만 본다.
 */

const GET_POINT_HISTORY_PATH = '/api/v1/History/W/sign/GetPointHistory'

const today = new Date()
const isoAt = (daysAgo: number, time = '09:07:00'): string => {
  const date = new Date(today)
  date.setDate(date.getDate() - daysAgo)
  return `${date.toISOString().slice(0, 10)}T${time}`
}

const row = (over: Partial<PointHistoryRow> = {}): PointHistoryRow => ({
  detailSeq: 418,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  pointSeq: 12,
  pointName: '정문 입구',
  checkDt: isoAt(0),
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
})

const detail = (over: Partial<PointHistoryDetail> = {}): PointHistoryDetail => ({
  detailSeq: 418,
  pointSeq: 12,
  pointName: '정문 입구',
  overtimeYn: false,
  hasMemo: false,
  status: 4,
  statusName: '완료',
  gpsLat: null,
  gpsLng: null,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  userSeq: 21,
  userName: '김근무',
  pauseTime: '00:07:00',
  checkDt: isoAt(0),
  authMethod: 9,
  authMethodName: 'QR',
  memoList: [],
  ...over,
})

const seed = (items: PointHistoryRow[]) =>
  server.use(
    http.get(GET_POINT_HISTORY_PATH, () =>
      HttpResponse.json({
        message: '',
        code: 200,
        data: { items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 },
      })
    )
  )

const renderCard = (data = detail()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PointHistoryRecentCard detail={data} siteSeq={7} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
})

afterEach(() => clearTokens())

describe('PointHistoryRecentCard', () => {
  it('🔴 분모를 함께 적는다 — "N회" 만으로는 잘한 것인지 알 수 없다', async () => {
    seed([
      row({ detailSeq: 418 }),
      row({ detailSeq: 419, checkDt: isoAt(2) }),
      // 미완료는 분모에만 들어간다(031 교정 — 미완료를 인증으로 세고 있었다)
      row({ detailSeq: 420, checkDt: isoAt(3), status: 3, statusName: '미완료' }),
    ])
    renderCard()

    expect(await screen.findByText('인증 2회 · 대상 순찰 3회')).toBeInTheDocument()
  })

  it('🔴 지금 보고 있는 인증을 목록에서 강조한다', async () => {
    seed([row({ detailSeq: 418 }), row({ detailSeq: 419, checkDt: isoAt(2) })])
    renderCard(detail({ detailSeq: 419, checkDt: isoAt(2) }))

    await screen.findByText(/인증 2회/)
    const current = document.querySelectorAll('[aria-current="true"]')
    // 강조가 없으면 "어느 행을 보고 있는지" 를 날짜로 맞춰 봐야 한다
    expect(current).toHaveLength(1)
    // 🔴 강조가 상태가 아니라 "지금 보는 인증" 임을 글로 말한다(spec 055)
    expect(current[0]).toHaveTextContent('이 인증')
    expect(screen.getAllByText('이 인증')).toHaveLength(1)
  })

  it('🔴 이번 인증이 14일 밖이면 그 사실을 적는다 — 빠진 것처럼 보이면 안 된다', async () => {
    seed([row({ detailSeq: 419, checkDt: isoAt(2) })])
    renderCard(detail({ detailSeq: 999, checkDt: '2026-01-02T09:07:00' }))

    expect(await screen.findByText(/최근 14일 범위 밖입니다/)).toBeInTheDocument()
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(0)
  })

  it('기록이 이 인증뿐이면 빈 상태를 적는다', async () => {
    seed([])
    renderCard()

    expect(await screen.findByText('최근 인증 기록이 없습니다')).toBeInTheDocument()
  })

  it('🔴 조회 실패를 "기록 없음" 으로 보여주지 않는다 — 이 카드만 실패할 수 있다', async () => {
    server.use(
      http.get(GET_POINT_HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 }))
    )
    renderCard()

    expect(await screen.findByText('최근 인증을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('최근 인증 기록이 없습니다')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('🔴 판정 문구를 적지 않는다 (spec §3-7)', async () => {
    seed([row()])
    renderCard()

    await screen.findByText(/인증 1회/)
    expect(screen.queryByText(/양호|개선|상한|기준 충족/)).not.toBeInTheDocument()
  })

  it('요청은 1개만 늘어난다 — 표와 추이가 같은 응답에서 나온다', async () => {
    const calls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname === GET_POINT_HISTORY_PATH) calls.push(request.url)
    })
    seed([row()])
    renderCard()

    await screen.findByText(/인증 1회/)
    expect(calls).toHaveLength(1)
    // 🔴 지점으로 좁혀 부른다 — 사업장 전체를 받아 클라이언트에서 거르지 않는다
    expect(new URL(calls[0]).searchParams.get('pointSeq')).toBe('12')
    server.events.removeAllListeners()
  })
})
