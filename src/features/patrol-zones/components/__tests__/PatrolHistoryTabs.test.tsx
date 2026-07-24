import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PatrolHistoryTabs from '../PatrolHistoryTabs'

const renderTabs = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <PatrolHistoryTabs />
    </MemoryRouter>
  )

describe('PatrolHistoryTabs', () => {
  it('두 탭(코스 순찰이력/지점 순찰이력) 렌더', () => {
    renderTabs('/patrol/zones')
    expect(screen.getByText('코스 순찰이력')).toBeInTheDocument()
    expect(screen.getByText('지점 순찰이력')).toBeInTheDocument()
  })

  it('/patrol/zones에서 "코스 순찰이력" 탭이 활성(강조) 상태', () => {
    renderTabs('/patrol/zones')
    expect(screen.getByText('코스 순찰이력').closest('a')).toHaveClass('border-point')
    expect(screen.getByText('지점 순찰이력').closest('a')).not.toHaveClass('border-point')
  })

  it('/patrol/points에서 "지점 순찰이력" 탭이 활성(강조) 상태', () => {
    renderTabs('/patrol/points')
    expect(screen.getByText('지점 순찰이력').closest('a')).toHaveClass('border-point')
    expect(screen.getByText('코스 순찰이력').closest('a')).not.toHaveClass('border-point')
  })
})
