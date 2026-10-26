import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { addDays, format, subDays } from 'date-fns'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import UserAssignmentCard from '../UserAssignmentCard'

/**
 * 근무자 상세 — 배치 이력 섹션 (`spec 042` T725 → `spec 049` 타임라인 · 더보기).
 * 시드: 장도윤(110) = 강서 스퀘어타워 배치중 1건 · 박지우(104) = 노원 파크뷰 복귀완료 · 배치 기록이 없는 근무자(999).
 */

const USER_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentHistory'

const renderCard = (userSeq: number, homeSiteName: string | null = '강동 테크노타워') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <UserAssignmentCard userSeq={userSeq} homeSiteName={homeSiteName} />
    </QueryClientProvider>
  )
}

/** 근무자별 이력 n 건 — 더보기 확인용(서버처럼 `pageNumber`·`pageSize` 로 자른다) */
const manyHistory = (count: number) =>
  http.get(USER_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const pageNumber = Number(query.get('pageNumber'))
    const pageSize = Number(query.get('pageSize'))
    const all = Array.from({ length: count }, (_, i) => ({
      assignmentSeq: 900 - i,
      siteSeq: 100 + i,
      siteName: `사업장${i + 1}`,
      startDt: '2026-01-01T00:00:00',
      endDt: null,
      completeYn: true,
      completeDt: null,
      status: 2,
      statusName: '복귀완료',
    }))
    const start = (pageNumber - 1) * pageSize
    return HttpResponse.json({
      message: '',
      code: 200,
      data: {
        items: all.slice(start, start + pageSize),
        page: pageNumber,
        pageSize,
        totalCount: count,
        totalPages: Math.ceil(count / pageSize),
      },
    })
  })

/** 오늘 기준 상대 날짜 행 1건 — 일수 문구는 오늘에 따라 바뀐다 */
const oneRow = (row: { status: 0 | 1 | 2; statusName: string; startDt: string; endDt: string | null }) =>
  http.get(USER_HISTORY_PATH, () =>
    HttpResponse.json({
      message: '',
      code: 200,
      data: {
        items: [{ assignmentSeq: 1, siteSeq: 9, siteName: '성수 오피스원', completeYn: false, completeDt: null, ...row }],
        page: 1,
        pageSize: 5,
        totalCount: 1,
        totalPages: 1,
      },
    })
  )

const ymd = (date: Date) => `${format(date, 'yyyy-MM-dd')}T00:00:00`

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetDeploymentStore()
})

describe('UserAssignmentCard', () => {
  it('그 사람의 배치를 소속지 → 도착지 · 기간 · 상태로 그린다', async () => {
    renderCard(110)

    expect(await screen.findByText('강서 스퀘어타워')).toBeInTheDocument()
    expect(screen.getByText('강동 테크노타워 →')).toBeInTheDocument()
    expect(screen.getByText('2026-03-01 ~ 미정')).toBeInTheDocument()
    expect(screen.getByText('배치중')).toBeInTheDocument()
    expect(screen.getByText('전체 사업장 배치 기록')).toBeInTheDocument()
  })

  it('🔴 소속지가 없으면 출발지를 생략한다', async () => {
    renderCard(110, null)

    expect(await screen.findByText('강서 스퀘어타워')).toBeInTheDocument()
    expect(screen.queryByText(/→/)).not.toBeInTheDocument()
  })

  it('🔴 배치중 — 시작일이 1일째 · 종료일이 있으면 남은 날', async () => {
    const today = new Date()
    server.use(
      oneRow({ status: 1, statusName: '배치중', startDt: ymd(subDays(today, 6)), endDt: ymd(addDays(today, 25)) })
    )
    renderCard(110)

    expect(await screen.findByText('7일째 · 25일 남음')).toBeInTheDocument()
  })

  it('🔴 배치중 — 종료일이 없으면 n일째만', async () => {
    renderCard(110)

    expect(await screen.findByText(/^\d+일째$/)).toBeInTheDocument()
    expect(screen.queryByText(/남음/)).not.toBeInTheDocument()
  })

  it('배치예정 — n일 후 시작', async () => {
    server.use(oneRow({ status: 0, statusName: '배치예정', startDt: ymd(addDays(new Date(), 3)), endDt: null }))
    renderCard(110)

    expect(await screen.findByText('3일 후 시작')).toBeInTheDocument()
  })

  it('🔴 복귀완료 — 복귀 시각(completeDt)과 기간 일수 (OQ-042-E 해소)', async () => {
    renderCard(104)

    expect(await screen.findByText('2025-12-01 ~ 2026-01-15 · 2026-01-15 18:00 복귀')).toBeInTheDocument()
    expect(screen.getByText('46일')).toBeInTheDocument()
    expect(screen.getByText('복귀완료')).toBeInTheDocument()
  })

  it('🔴 더보기 — 5건씩 이어 붙이고 다 보이면 사라진다 · 상태 필터를 보내지 않는다', async () => {
    const calls: URL[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === USER_HISTORY_PATH) calls.push(target)
    })
    server.use(manyHistory(7))
    const user = userEvent.setup()
    renderCard(110)

    expect(await screen.findByText('사업장5')).toBeInTheDocument()
    expect(screen.queryByText('사업장6')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: '상태' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '더보기' }))

    expect(await screen.findByText('사업장7')).toBeInTheDocument()
    expect(screen.getByText('사업장1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '더보기' })).not.toBeInTheDocument()
    const last = calls[calls.length - 1].searchParams
    expect(last.get('pageNumber')).toBe('1')
    expect(last.get('pageSize')).toBe('10')
    expect(last.get('status')).toBeNull()
    server.events.removeAllListeners()
  })

  it('배치 기록이 없으면 빈 상태다', async () => {
    renderCard(999)

    expect(await screen.findByText('배치 이력이 없습니다')).toBeInTheDocument()
  })

  it('🔴 조회 실패를 "이력 없음" 으로 보여주지 않는다 · 다시 시도', async () => {
    server.use(http.get(USER_HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderCard(110)

    expect(await screen.findByText('배치 이력을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('배치 이력이 없습니다')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled())
  })
})
