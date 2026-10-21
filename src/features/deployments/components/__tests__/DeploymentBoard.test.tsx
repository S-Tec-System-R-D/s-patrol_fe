import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DeploymentBoard from '../DeploymentBoard'

/**
 * 배치 요청 · 전출 · 전입 — **탭 3개 + 표 1개** (`spec 039` T649g).
 *
 * 🔴 화면 결과가 아니라 **서버로 나간 요청**을 본다 — 활성 탭의 쿼리만 나가는지, 이력은 `direction` 으로
 * 거르는지. 시드(사업장 7): 요청 = 최범수 · 배수진 / 전출 = 장도윤(배치 중) · 박지우(복귀) /
 * 전입 = 오준혁(배치 중) · 한지민(복귀).
 */

const REQUEST_LIST_PATH = '/api/v1/Deployment/W/sign/GetDeploymentRequestList'
const HISTORY_PATH = '/api/v1/Deployment/W/sign/GetDeploymentHistory'
const APPROVE_PATH = '/api/v1/Deployment/W/sign/ApproveDeploymentRequest'

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

const renderBoard = (initialEntry = '/deployments') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <DeploymentBoard />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const search = () => screen.getByTestId('location-search').textContent ?? ''
const inTable = () => within(screen.getByRole('table'))

/** 목록 API 호출을 모은다 — 경로 + `direction` */
const captureCalls = () => {
  const calls: { path: string; direction: string | null }[] = []
  server.events.on('request:start', ({ request }) => {
    const target = new URL(request.url)
    if (target.pathname === REQUEST_LIST_PATH || target.pathname === HISTORY_PATH) {
      calls.push({ path: target.pathname, direction: target.searchParams.get('direction') })
    }
  })
  return calls
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

afterEach(() => {
  server.events.removeAllListeners()
})

describe('DeploymentBoard — 탭', () => {
  it('🔴 기본 탭은 배치 요청이고 대기 건수를 붙인다 · 요청 목록만 조회한다', async () => {
    const calls = captureCalls()
    renderBoard()

    await screen.findByRole('table')
    expect(screen.getByRole('tab', { name: /배치 요청/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tab', { name: /배치 요청/ })).getByText('2')).toBeInTheDocument()
    expect(inTable().getByText('최범수')).toBeInTheDocument()
    expect(calls.every((call) => call.path === REQUEST_LIST_PATH)).toBe(true)
  })

  it('"전출 이력" 탭 → ?tab=out + direction 0 · 오준혁(전입)은 없다', async () => {
    const calls = captureCalls()
    const user = userEvent.setup()
    renderBoard()
    await screen.findByRole('table')

    await user.click(screen.getByRole('tab', { name: /전출 이력/ }))

    await waitFor(() => expect(search()).toContain('tab=out'))
    expect(await screen.findByText('장도윤')).toBeInTheDocument()
    expect(screen.queryByText('오준혁')).not.toBeInTheDocument()
    expect(calls[calls.length - 1]).toEqual({ path: HISTORY_PATH, direction: '0' })
  })

  it('"전입 이력" 탭 → direction 1', async () => {
    const calls = captureCalls()
    const user = userEvent.setup()
    renderBoard()
    await screen.findByRole('table')

    await user.click(screen.getByRole('tab', { name: /전입 이력/ }))

    expect(await screen.findByText('오준혁')).toBeInTheDocument()
    expect(calls[calls.length - 1]).toEqual({ path: HISTORY_PATH, direction: '1' })
  })

  it('🔴 탭을 바꾸면 페이지를 지운다 — 다른 탭의 같은 페이지는 비어 있을 수 있다', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=out&page=3')

    await user.click(await screen.findByRole('tab', { name: /전입 이력/ }))

    await waitFor(() => expect(search()).toContain('tab=in'))
    expect(search()).not.toContain('page=')
  })

  it('탭에 따라 끝 칸이 바뀐다 — 요청: 요청일 + 승인 / 이력: 기간 + 상태', async () => {
    const user = userEvent.setup()
    renderBoard()

    await screen.findByRole('table')
    expect(inTable().getByText('요청일')).toBeInTheDocument()
    expect(inTable().getByRole('button', { name: '최범수 승인' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /전출 이력/ }))
    await screen.findByText('장도윤')
    expect(inTable().getByText('기간')).toBeInTheDocument()
    expect(inTable().getByText('배치중')).toBeInTheDocument()
    expect(inTable().getByText('복귀완료')).toBeInTheDocument()
    expect(inTable().getByText('2026.03 ~ 현재')).toBeInTheDocument()
  })
})

describe('DeploymentBoard — 이력 상태 필터 (T649h)', () => {
  const captureStatus = () => {
    const statuses: (string | null)[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === HISTORY_PATH) statuses.push(target.searchParams.get('status'))
    })
    return statuses
  }

  it('🔴 ?status=active 면 서버에 status 0 · 배치 중인 사람만 나온다', async () => {
    const statuses = captureStatus()
    renderBoard('/deployments?tab=out&status=active')

    expect(await screen.findByText('장도윤')).toBeInTheDocument()
    expect(screen.queryByText('박지우')).not.toBeInTheDocument()
    expect(statuses[statuses.length - 1]).toBe('0')
  })

  it('필터를 고르면 URL·서버로 나가고, 초기화하면 지워진다', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=in')
    await screen.findByText('오준혁')

    await user.click(within(screen.getByRole('group', { name: '목록 필터' })).getByLabelText('상태'))
    await user.click(await screen.findByRole('option', { name: '복귀완료' }))

    await waitFor(() => expect(search()).toContain('status=returned'))
    expect(await screen.findByText('한지민')).toBeInTheDocument()
    expect(screen.queryByText('오준혁')).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('필터 초기화'))
    await waitFor(() => expect(search()).not.toContain('status'))
  })

  it('🔴 탭을 바꾸면 상태 필터도 지운다', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=out&status=active')

    await user.click(await screen.findByRole('tab', { name: /전입 이력/ }))

    await waitFor(() => expect(search()).toContain('tab=in'))
    expect(search()).not.toContain('status')
  })

  it('요청 탭에는 필터 줄이 없다', async () => {
    renderBoard()

    await screen.findByRole('table')
    expect(screen.queryByRole('group', { name: '목록 필터' })).not.toBeInTheDocument()
  })
})

describe('DeploymentBoard — 상태', () => {
  it('🔴 승인하면 전입 이력이 1건 늘어난다', async () => {
    await fetch(APPROVE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestSeq: 501 }),
    })
    renderBoard('/deployments?tab=in')

    expect(await screen.findByText('최범수')).toBeInTheDocument()
    expect(inTable().getAllByRole('row')).toHaveLength(4) // 헤더 + 3
  })

  it('🔴 조회 실패를 "없음" 으로 보여주지 않는다', async () => {
    server.use(http.get(HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderBoard('/deployments?tab=out')

    expect(await screen.findByText('배치 이력을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('전출 이력이 없습니다')).not.toBeInTheDocument()
  })

  it('요청이 0건이면 탭 건수를 그리지 않고 빈 상태다', async () => {
    server.use(
      http.get(REQUEST_LIST_PATH, () =>
        HttpResponse.json({ message: '', code: 200, data: { items: [], page: 1, pageSize: 10, totalCount: 0 } })
      ),
      http.get('/api/v1/Deployment/W/sign/GetDeploymentSummary', () =>
        HttpResponse.json({ message: '', code: 200, data: { outCount: 1, inCount: 1, pendingCount: 0 } })
      )
    )
    renderBoard()

    expect(await screen.findByText('대기 중인 요청이 없습니다')).toBeInTheDocument()
    expect(within(screen.getByRole('tab', { name: /배치 요청/ })).queryByText('0')).not.toBeInTheDocument()
  })
})
