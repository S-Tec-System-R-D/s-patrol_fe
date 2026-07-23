import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RailSidebar } from '../RailSidebar'

const renderRail = (initialPath: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <RailSidebar />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RailSidebar', () => {
  it('5개 메뉴 아이콘 flat 렌더(순찰이력·코스/지점·근무자·배치관리·공지사항)', () => {
    renderRail('/zones')
    expect(screen.getByLabelText('순찰이력')).toBeInTheDocument()
    expect(screen.getByLabelText('코스/지점')).toBeInTheDocument()
    expect(screen.getByLabelText('근무자')).toBeInTheDocument()
    expect(screen.getByLabelText('배치관리')).toBeInTheDocument()
    expect(screen.getByLabelText('공지사항')).toBeInTheDocument()
  })

  it('현재 경로(/zones)에 해당하는 메뉴가 활성 상태(bg-rail-2)', () => {
    renderRail('/zones')
    expect(screen.getByLabelText('코스/지점')).toHaveClass('bg-rail-2')
    expect(screen.getByLabelText('근무자')).not.toHaveClass('bg-rail-2')
  })

  it('프로필 아바타 트리거 렌더', () => {
    renderRail('/zones')
    expect(screen.getByLabelText('프로필 메뉴 열기')).toBeInTheDocument()
  })
})
