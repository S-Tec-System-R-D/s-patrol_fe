import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import DeploymentHistoryTabs from '../DeploymentHistoryTabs'

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
