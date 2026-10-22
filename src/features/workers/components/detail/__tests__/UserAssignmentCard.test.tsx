import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import UserAssignmentCard from '../UserAssignmentCard'

/**
 * 근무자 상세 — 배치 이력 섹션 (`spec 042` T725).
 * 시드: 장도윤(110) = 강서 스퀘어타워 배치중 1건 · 배치 기록이 없는 근무자(999).
 */

const USER_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentHistory'

const renderCard = (userSeq: number) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <UserAssignmentCard userSeq={userSeq} />
    </QueryClientProvider>
  )
}

/** 근무자별 이력 n 건 — 페이지 이동 확인용(서버처럼 `pageNumber`·`pageSize` 로 자른다) */
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

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetDeploymentStore()
})

describe('UserAssignmentCard', () => {
  it('그 사람의 배치를 사업장 · 기간 · 상태로 그린다', async () => {
    renderCard(110)

    expect(await screen.findByText('강서 스퀘어타워')).toBeInTheDocument()
    expect(screen.getByText('2026-03-01 ~ 미정')).toBeInTheDocument()
    expect(screen.getByText('배치중')).toBeInTheDocument()
    expect(screen.getByText('전체 사업장 배치 기록')).toBeInTheDocument()
  })

  it('🔴 5건씩 서버 페이징으로 넘긴다', async () => {
    server.use(manyHistory(7))
    const user = userEvent.setup()
    renderCard(110)

    expect(await screen.findByText('사업장1')).toBeInTheDocument()
    expect(screen.queryByText('사업장6')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2페이지' }))

    expect(await screen.findByText('사업장6')).toBeInTheDocument()
    expect(screen.queryByText('사업장1')).not.toBeInTheDocument()
  })

  it('🔴 상태 필터 — 서버 status 코드로 거르고 첫 페이지로 · 0건은 "조건에 맞는" 빈 상태 (042 후속)', async () => {
    const statuses: (string | null)[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === USER_HISTORY_PATH) statuses.push(target.searchParams.get('status'))
    })
    const user = userEvent.setup()
    renderCard(110)

    expect(await screen.findByText('강서 스퀘어타워')).toBeInTheDocument()
    expect(statuses[0]).toBeNull()

    await user.click(screen.getByRole('combobox', { name: '상태' }))
    await user.click(await screen.findByRole('option', { name: '복귀완료' }))

    expect(await screen.findByText('조건에 맞는 배치 이력이 없습니다')).toBeInTheDocument()
    expect(statuses[statuses.length - 1]).toBe('2')

    await user.click(screen.getByRole('combobox', { name: '상태' }))
    await user.click(await screen.findByRole('option', { name: '배치중' }))
    expect(await screen.findByText('강서 스퀘어타워')).toBeInTheDocument()
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
