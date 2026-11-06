import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { notify } from '@/lib/notify'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DeploymentsPage from '../DeploymentsPage'

/**
 * `/deployments` 배치관리 — 통합 테스트(`spec 039` T646 → `spec 042` T717, 🔴 A급).
 *
 * 🔴 **MSW 가 상태를 보유한다** — 승인·반려가 실제로 요청·요약을 바꾸고, 화면이 무효화 뒤 다시 받아
 * 맞는 숫자를 그리는지 본다. 시드(사업장 7): 대기 2(최범수 501 · 배수진 502) · 나간 1 · 온 1.
 *
 * 앱과 같은 **전역 MutationCache 오류 토스트**를 붙인다 — 실패 토스트가 그 경로로 나간다(`queryClient.ts`).
 */

const SUMMARY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentCount'
const IN_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentInHistory'
const OUT_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentOutHistory'
const APPROVE_PATH = '/api/v1/Assignment/W/sign/AssignmentApprove'
const LIST_PATH = '/api/v1/Assignment/W/sign/GetAssignmentList'

/**
 * 🔴 **표(`xl` 이상) 안에서만 찾는다**(`spec 055`) — jsdom 은 미디어쿼리가 없어 `xl` 미만 카드도 함께 그려져
 * 같은 이름 · 버튼이 두 벌이다.
 */
const tableEl = () => screen.queryByRole('table')
const findInTable = (text: string, _?: unknown, options?: { timeout?: number }) =>
  waitFor(() => within(screen.getByRole('table')).getByText(text), options)
const getInTable = (text: string) => within(screen.getByRole('table')).getByText(text)
const queryInTable = (text: string) => {
  const table = tableEl()
  return table ? within(table).queryByText(text) : null
}
const findButtonInTable = (name: string) =>
  waitFor(() => within(screen.getByRole('table')).getByRole('button', { name }))
const getButtonInTable = (name: string) => within(screen.getByRole('table')).getByRole('button', { name })
const queryButtonInTable = (name: string) => {
  const table = tableEl()
  return table ? within(table).queryByRole('button', { name }) : null
}

const renderPage = (initialEntry = '/deployments') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    mutationCache: new MutationCache({
      onError: (err) => notify.error((err as Error).message),
    }),
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <DeploymentsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 탭 뱃지까지 읽는다 — 뱃지는 탭 이름에 붙는다 */
const requestTab = () => screen.getByRole('tab', { name: /배치 요청/ })

/** 제목 줄 오른쪽 칸에서 라벨로 값을 찾는다 */
const stat = (label: string) => screen.getByText(label).parentElement as HTMLElement

/** 처리 API 로 나간 바디를 모은다 */
const captureApproveBodies = () => {
  const bodies: unknown[] = []
  server.events.on('request:start', async ({ request }) => {
    if (new URL(request.url).pathname === APPROVE_PATH) bodies.push(await request.clone().json())
  })
  return bodies
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

afterEach(() => {
  vi.restoreAllMocks()
  server.events.removeAllListeners()
})

describe('DeploymentsPage — 요청 목록', () => {
  it('대기 중인 요청을 서버에서 받아 그린다 · 부제가 선택 사업장명이다', async () => {
    renderPage()

    expect(await findInTable('최범수')).toBeInTheDocument()
    expect(getInTable('배수진')).toBeInTheDocument()
    expect(
      screen.getByText('강동 테크노타워 소속 근무자의 배치 이력과 요청을 확인합니다')
    ).toBeInTheDocument()
  })

  it('🔴 조회 실패를 "요청 없음" 으로 보여주지 않는다', async () => {
    server.use(http.get(LIST_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderPage()

    expect(await screen.findByText('배치 요청을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('대기 중인 배치 요청이 없습니다')).not.toBeInTheDocument()
  })
})

describe('DeploymentsPage — 배치 요약', () => {
  it('🔴 KPI 줄이 없고 전출 · 전입 인원을 제목 줄에 적는다', async () => {
    renderPage()

    await waitFor(() => expect(stat('전출 인원')).toHaveTextContent('1명'))
    await waitFor(() => expect(stat('전입 인원')).toHaveTextContent('1명'))
    expect(screen.queryByText('대기중인 배치요청')).not.toBeInTheDocument()
    expect(requestTab()).toHaveTextContent('2')
    expect(screen.getByRole('tab', { name: /복귀 요청/ })).toHaveTextContent('1')
  })

  it('🔴 배치중만 센다 — 요약의 숫자는 시작 전 배치까지 들어 있다', async () => {
    const queries: URLSearchParams[] = []
    server.events.on('request:start', ({ request }) => {
      const url = new URL(request.url)
      if (url.pathname === IN_HISTORY_PATH || url.pathname === OUT_HISTORY_PATH) {
        queries.push(url.searchParams)
      }
    })
    renderPage()

    await waitFor(() => expect(stat('전입 인원')).toHaveTextContent('1명'))
    expect(queries).toHaveLength(2)
    queries.forEach((query) => expect(query.get('status')).toBe('1'))
  })

  it('🔴 인원 조회 실패는 0 이 아니라 - 다', async () => {
    const fail = () => HttpResponse.json({ message: 'x' }, { status: 500 })
    server.use(http.get(IN_HISTORY_PATH, fail), http.get(OUT_HISTORY_PATH, fail))
    renderPage()

    await waitFor(() => expect(stat('전출 인원')).toHaveTextContent('-'))
    await waitFor(() => expect(stat('전입 인원')).toHaveTextContent('-'))
  })

  it('🔴 요약 실패는 탭 뱃지가 - 다 — 뱃지가 사라지면 "대기 0건" 으로 읽힌다', async () => {
    server.use(http.get(SUMMARY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderPage()

    await waitFor(() => expect(requestTab()).toHaveTextContent('-'))
    expect(screen.getByRole('tab', { name: /복귀 요청/ })).toHaveTextContent('-')
    expect(screen.getByRole('tab', { name: /전입 이력/ })).not.toHaveTextContent('-')
  })

  it('🔴 이력 탭은 상태 필터 없이 기록 전체다 — 복귀완료도 나온다', async () => {
    const user = userEvent.setup()
    renderPage()
    await findInTable('최범수')

    await user.click(screen.getByRole('tab', { name: /전입 이력/ }))
    expect(await findInTable('오준혁')).toBeInTheDocument()
    expect(getInTable('한지민')).toBeInTheDocument()
  })
})

describe('DeploymentsPage — 승인 (🔴 A급)', () => {
  it('승인하면 approved: true · 행이 사라지고 대기 -1 · 배치 온 +1 · 성공 토스트', async () => {
    const bodies = captureApproveBodies()
    const success = vi.spyOn(notify, 'success')
    const user = userEvent.setup()
    renderPage()

    await user.click(await findButtonInTable('배수진 승인'))

    await waitFor(() => expect(queryInTable('배수진')).not.toBeInTheDocument())
    expect(bodies).toEqual([{ assignmentSeq: 502, approved: true }])
    expect(success).toHaveBeenCalledWith('배수진님의 배치 요청을 승인했습니다.')
    await waitFor(() => expect(requestTab()).toHaveTextContent('1'))
    await waitFor(() => expect(stat('전입 인원')).toHaveTextContent('2명'))
  })

  it('🔴 연타해도 요청은 1번만 나간다 — 처리 중 두 버튼이 막힌다', async () => {
    let calls = 0
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname === APPROVE_PATH) calls += 1
    })
    const user = userEvent.setup()
    renderPage()

    const approve = await findButtonInTable('최범수 승인')
    await user.click(approve)
    // 처리 중 — 두 버튼 모두 막혀 있거나 행이 이미 사라졌다
    const stillThere = queryButtonInTable('최범수 승인')
    if (stillThere) {
      expect(stillThere).toBeDisabled()
      expect(getButtonInTable('최범수 반려')).toBeDisabled()
      await user.click(stillThere)
    }

    await waitFor(() => expect(queryInTable('최범수')).not.toBeInTheDocument())
    expect(calls).toBe(1)
  })

  it('🔴 이미 처리된 요청 → 서버 메시지 토스트 + 목록 재조회로 행이 정리된다', async () => {
    const error = vi.spyOn(notify, 'error')
    const user = userEvent.setup()
    renderPage()

    await findInTable('최범수')
    // 다른 관리자가 먼저 처리했다 — 서버에서만 사라진 상태를 만든다
    await fetch(APPROVE_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentSeq: 501, approved: true }),
    })
    await user.click(getButtonInTable('최범수 승인'))

    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('이미 승인 또는 반려 처리된 배치입니다.')
    )
    await waitFor(() => expect(queryInTable('최범수')).not.toBeInTheDocument())
  })
})

describe('DeploymentsPage — 반려 (🔴 A급)', () => {
  it('🔴 반려는 확인창을 거쳐 approved: false 로 나간다 · 사유 입력이 없다 · 배치 온 인원은 그대로', async () => {
    const bodies = captureApproveBodies()
    const success = vi.spyOn(notify, 'success')
    const user = userEvent.setup()
    renderPage()

    await user.click(await findButtonInTable('배수진 반려'))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '반려' }))

    await waitFor(() => expect(queryInTable('배수진')).not.toBeInTheDocument())
    expect(bodies).toEqual([{ assignmentSeq: 502, approved: false }])
    expect(success).toHaveBeenCalledWith('배수진님의 배치 요청을 반려했습니다.')
    await waitFor(() => expect(requestTab()).toHaveTextContent('1'))
    expect(stat('전입 인원')).toHaveTextContent('1명')
  })

  it('🔴 확인창에서 취소하면 요청이 나가지 않는다', async () => {
    const bodies = captureApproveBodies()
    const user = userEvent.setup()
    renderPage()

    await user.click(await findButtonInTable('배수진 반려'))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '취소' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(getInTable('배수진')).toBeInTheDocument()
    expect(bodies).toEqual([])
  })
})
