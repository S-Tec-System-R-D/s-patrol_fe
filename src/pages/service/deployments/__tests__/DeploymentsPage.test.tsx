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
 * `/deployments` 배치관리 — `spec 039` US2 통합 테스트(T646, 🔴 A급).
 *
 * 🔴 **MSW 가 상태를 보유한다** — 승인·거부가 실제로 요청·요약을 바꾸고, 화면이 무효화 뒤 다시 받아
 * 맞는 숫자를 그리는지 본다. 시드(사업장 7): 대기 2(최범수 501 · 배수진 502) · 나간 1 · 온 1.
 * ⚠️ 이력 탭 쪽 검증(승인 → 전입 +1)은 Phase 5(T649)에서 — 이력은 그때 옮긴다.
 *
 * 앱과 같은 **전역 MutationCache 오류 토스트**를 붙인다 — 실패 토스트가 그 경로로 나간다(`queryClient.ts`).
 */

const APPROVE_PATH = '/api/v1/Deployment/W/sign/ApproveDeploymentRequest'
const REJECT_PATH = '/api/v1/Deployment/W/sign/RejectDeploymentRequest'
const REQUEST_LIST_PATH = '/api/v1/Deployment/W/sign/GetDeploymentRequestList'

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

/** KPI 카드에서 라벨로 숫자를 찾는다 */
const kpiValue = (label: string) =>
  within(screen.getByText(label).closest('div[class*="rounded"]') as HTMLElement)

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

    expect(await screen.findByText('최범수')).toBeInTheDocument()
    expect(screen.getByText('배수진')).toBeInTheDocument()
    expect(
      screen.getByText('강동 테크노타워 소속 근무자의 배치 이력과 요청을 확인합니다')
    ).toBeInTheDocument()
  })

  it('🔴 조회 실패를 "요청 없음" 으로 보여주지 않는다', async () => {
    server.use(
      http.get(REQUEST_LIST_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 }))
    )
    renderPage()

    expect(await screen.findByText('배치 요청을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('대기 중인 요청이 없습니다')).not.toBeInTheDocument()
  })
})

describe('DeploymentsPage — 빈 페이지 방지 (spec §4)', () => {
  it('🔴 요청이 사라져 현재 페이지가 비면 이전 페이지로 돌아간다', async () => {
    // 2페이지를 보고 있었는데(1페이지 10건 + 2페이지 1건) 처리로 2페이지가 비었다 — 시드 2건이면 2페이지는 빈 응답이다
    renderPage('/deployments?page=2')

    // 2페이지 조회 → 비었음 → 이전 페이지로 → 다시 조회, 왕복이 두 번이라 기본 1초보다 길게 기다린다
    expect(await screen.findByText('최범수', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByText('대기 중인 요청이 없습니다')).not.toBeInTheDocument()
  })
})

describe('DeploymentsPage — KPI → 탭 (T649g)', () => {
  it('🔴 KPI 카드를 누르면 해당 탭 + 배치중 필터 — 숫자와 행 수가 맞는다 (T649h)', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('최범수')

    await user.click(screen.getByRole('button', { name: '전입 이력 보기' }))
    expect(await screen.findByText('오준혁')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /전입 이력/ })).toHaveAttribute('aria-selected', 'true')
    // 배치 온 인원 1명 = 행 1개(복귀 완료한 한지민은 없다)
    expect(screen.queryByText('한지민')).not.toBeInTheDocument()
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: '전출 이력 보기' }))
    expect(await screen.findByText('장도윤')).toBeInTheDocument()
    expect(screen.queryByText('박지우')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '배치 요청 보기' }))
    expect(await screen.findByText('최범수')).toBeInTheDocument()
  })
})

describe('DeploymentsPage — 승인 (🔴 A급)', () => {
  it('승인하면 행이 사라지고 KPI 대기 -1 · 배치 온 +1 · 성공 토스트', async () => {
    // 🔴 배수진 = 시작일이 지난 배치(배치중) — 배치예정이면 "현재 인원" 에 들어가지 않는다(T656)
    const success = vi.spyOn(notify, 'success')
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '배수진 승인' }))

    await waitFor(() => expect(screen.queryByText('배수진')).not.toBeInTheDocument())
    expect(success).toHaveBeenCalledWith('배수진님의 배치 요청을 승인했습니다.')
    await waitFor(() => expect(kpiValue('대기중인 배치요청').getByText('1')).toBeInTheDocument())
    expect(kpiValue('배치 온 인원').getByText('2')).toBeInTheDocument()
  })

  it('🔴 연타해도 요청은 1번만 나간다 — 처리 중 두 버튼이 막힌다', async () => {
    let calls = 0
    server.events.on('request:start', ({ request }) => {
      if (new URL(request.url).pathname === APPROVE_PATH) calls += 1
    })
    const user = userEvent.setup()
    renderPage()

    const approve = await screen.findByRole('button', { name: '최범수 승인' })
    await user.click(approve)
    // 처리 중 — 두 버튼 모두 막혀 있거나 행이 이미 사라졌다
    const stillThere = screen.queryByRole('button', { name: '최범수 승인' })
    if (stillThere) {
      expect(stillThere).toBeDisabled()
      expect(screen.getByRole('button', { name: '최범수 거부' })).toBeDisabled()
      await user.click(stillThere)
    }

    await waitFor(() => expect(screen.queryByText('최범수')).not.toBeInTheDocument())
    expect(calls).toBe(1)
  })

  it('🔴 이미 처리된 요청 → 서버 메시지 토스트 + 목록 재조회로 행이 정리된다', async () => {
    const error = vi.spyOn(notify, 'error')
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('최범수')
    // 다른 관리자가 먼저 처리했다 — 서버에서만 사라진 상태를 만든다
    await fetch(APPROVE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestSeq: 501 }),
    })
    await user.click(screen.getByRole('button', { name: '최범수 승인' }))

    await waitFor(() => expect(error).toHaveBeenCalledWith('이미 처리된 요청입니다.'))
    await waitFor(() => expect(screen.queryByText('최범수')).not.toBeInTheDocument())
  })
})

describe('DeploymentsPage — 거부 (🔴 A급)', () => {
  it('사유를 적어 거부하면 모달이 닫히고 행이 사라진다 · 배치 온 인원은 그대로', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '배수진 거부' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/거부 사유/), '인원 충분')
    await user.click(within(dialog).getByRole('button', { name: '거부' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.queryByText('배수진')).not.toBeInTheDocument())
    await waitFor(() => expect(kpiValue('대기중인 배치요청').getByText('1')).toBeInTheDocument())
    expect(kpiValue('배치 온 인원').getByText('1')).toBeInTheDocument()
  })

  it('🔴 거부가 실패하면 모달이 열린 채 사유가 남는다', async () => {
    server.use(http.post(REJECT_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: '배수진 거부' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/거부 사유/), '인원 충분')
    await user.click(within(dialog).getByRole('button', { name: '거부' }))

    await waitFor(() => expect(within(dialog).getByRole('button', { name: '거부' })).toBeEnabled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/거부 사유/)).toHaveValue('인원 충분')
  })
})
