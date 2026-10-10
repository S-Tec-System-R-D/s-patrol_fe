import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import DeploymentHistoryTabs from '../DeploymentHistoryTabs'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * 전입/전출 판정은 `useMe().locationName`과 mock 데이터의 문자열 비교로 이뤄진다.
 *
 * ✅ **021에서 `vi.mock` 스텁을 걷어냈다.** 020까지는 사업장명이 JWT에 없어
 * `locationName`이 항상 `undefined`였고(수용된 일시 퇴행), 이 테스트는 `useMe`를 통째로
 * 스텁해 기능 검증만 유지하고 있었다. 이제 사업장 선택이 실제 값을 넣으므로, 스텁 대신
 * **토큰 + 선택 결과를 심어** 실제 경로로 검증한다.
 *
 * 🔴 스텁을 남겨 뒀다면 실제 값을 가려 "동작한다고 착각"하게 된다(spec 020 이월 경고).
 */

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

const renderTabs = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/deployments']}>
        <DeploymentHistoryTabs />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DeploymentHistoryTabs', () => {
  // 토큰 = 로그인 상태, 선택 결과 = 소속 사업장. 둘이 합쳐져 `useMe().locationName`이 된다.
  // 사업장명은 `deploymentData.ts`의 전출/전입 문자열과 맞춰야 판정이 성립한다.
  beforeEach(() => {
    clearTokens()
    setAccessToken(makeAccessToken())
    // mock 데이터가 siteSeq 7(강동 테크노타워) 기준이다 — 2026-10-10 교정
    setSite(7, '강동 테크노타워')
  })

  it('기본 탭("전출 이력")에 이력이 렌더', async () => {
    renderTabs()
    expect(await screen.findByText('오준혁')).toBeInTheDocument()
  })

  it('"전입 이력" 탭 클릭 시 ?historyTab=in 반영 + 해당 이력 렌더', async () => {
    renderTabs()
    await screen.findByText('오준혁')
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: '전입 이력' }))

    expect(screen.getByTestId('location-search')).toHaveTextContent('historyTab=in')
    expect(await screen.findByText('최수아')).toBeInTheDocument()
  })
})
