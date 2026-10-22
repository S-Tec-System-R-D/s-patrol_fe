import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DeploymentKpiRow from '../DeploymentKpiRow'

/**
 * 배치 KPI 4종 (`spec 039` T639 · `spec 042` T711 · 042 후속) — 요약 쿼리의 숫자를 그린다.
 * 시드(사업장 7): 나간 1 · 온 1 · 배치 대기 2 · 복귀 대기 1.
 */

const SUMMARY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentCount'

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

const renderRow = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {/* KPI 가 탭 쿼리(`?tab`)를 바꾸므로 라우터가 필요하다(T649g) */}
      <MemoryRouter>
        <DeploymentKpiRow />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

describe('DeploymentKpiRow', () => {
  it('요약 응답의 숫자 4개를 그린다 — 복귀 대기는 pendingReturnCount', async () => {
    renderRow()

    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(3)
    expect(screen.getByText('배치 나간 인원')).toBeInTheDocument()
    expect(screen.getByText('배치 온 인원')).toBeInTheDocument()
    expect(screen.getByText('대기중인 배치요청')).toBeInTheDocument()
    expect(screen.getByText('대기중인 복귀요청')).toBeInTheDocument()
  })

  it('복귀 대기 카드를 누르면 복귀 요청 탭으로 간다', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.click(await screen.findByRole('button', { name: '복귀 요청 보기' }))

    await waitFor(() =>
      expect(screen.getByTestId('location-search').textContent).toContain('tab=returns')
    )
  })

  it('🔴 나간·온 인원에 "배치예정 포함" 을 적는다 — 서버가 시작 전 배치도 센다', async () => {
    renderRow()

    await screen.findByText('2')
    expect(screen.getAllByText('배치예정 포함')).toHaveLength(2)
  })

  it('🔴 카드를 누르면 탭만 바뀌고 상태 필터를 걸지 않는다', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.click(await screen.findByRole('button', { name: '전입 이력 보기' }))

    const search = () => screen.getByTestId('location-search').textContent ?? ''
    await waitFor(() => expect(search()).toContain('tab=in'))
    expect(search()).not.toContain('status')
  })

  it('🔴 요약 실패는 0 이 아니라 - 다 — "대기 0건" 은 거짓 안심이다', async () => {
    server.use(http.get(SUMMARY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderRow()

    expect(await screen.findAllByText('-')).toHaveLength(4)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('🔴 로딩 중에는 숫자를 그리지 않는다', () => {
    renderRow()

    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('-')).not.toBeInTheDocument()
  })
})
