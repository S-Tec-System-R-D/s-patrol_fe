import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import DeploymentHistoryTabs from '../DeploymentHistoryTabs'

/**
 * 전입/전출 판정은 `useMe().locationName`과 mock 데이터의 문자열 비교로 이뤄진다.
 *
 * 020에서 사용자 정보가 JWT 클레임으로 바뀌었고 **클레임에 사업장명이 없다** —
 * 실제 `locationName`은 `spec 021`의 사업장 선택에서 들어온다. 그래서 그때까지
 * 이 화면의 전입/전출 필터는 빈 결과가 된다(spec 020 §3 규칙 7, 수용된 일시 퇴행).
 *
 * 이 테스트의 관심사는 **탭 전환과 이력 렌더**이고 인증이 아니므로, 사업장명을 스텁해
 * 기능 검증을 그대로 유지한다. 021에서 실제 값이 들어오면 이 스텁을 걷어낸다.
 */
vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => ({
    data: {
      userSeq: 1,
      name: '홍길동',
      role: 'FIELD_MANAGER' as const,
      locationName: '강동 그랜드타워',
    },
    isLoading: false,
    isError: false,
  }),
}))

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
