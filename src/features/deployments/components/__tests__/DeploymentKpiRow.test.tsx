import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DeploymentKpiRow from '../DeploymentKpiRow'

/**
 * 배치 KPI 3종 (`spec 039` T639) — 요약 쿼리의 숫자를 그린다.
 * 시드(사업장 7): 나간 1 · 온 1 · 대기 2.
 */

const SUMMARY_PATH = '/api/v1/Deployment/W/sign/GetDeploymentSummary'

const renderRow = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {/* KPI 가 탭 쿼리(`?tab`)를 바꾸므로 라우터가 필요하다(T649g) */}
      <MemoryRouter>
        <DeploymentKpiRow />
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
  it('요약 응답의 숫자 3개를 그린다', async () => {
    renderRow()

    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('배치 나간 인원')).toBeInTheDocument()
    expect(screen.getByText('배치 온 인원')).toBeInTheDocument()
    expect(screen.getByText('대기중인 배치요청')).toBeInTheDocument()
  })

  it('🔴 요약 실패는 0 이 아니라 - 다 — "대기 0건" 은 거짓 안심이다', async () => {
    server.use(http.get(SUMMARY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderRow()

    expect(await screen.findAllByText('-')).toHaveLength(3)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('🔴 로딩 중에는 숫자를 그리지 않는다', () => {
    renderRow()

    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('-')).not.toBeInTheDocument()
  })
})
