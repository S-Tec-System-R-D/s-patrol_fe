import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CourseTabs from '../CourseTabs'

const renderTabs = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CourseTabs />
    </MemoryRouter>
  )

describe('CourseTabs', () => {
  it('두 탭(코스/지점) 렌더', () => {
    renderTabs('/zones')
    expect(screen.getByText('코스')).toBeInTheDocument()
    expect(screen.getByText('지점')).toBeInTheDocument()
  })

  it('/zones에서 "코스" 탭이 활성(강조) 상태', () => {
    renderTabs('/zones')
    expect(screen.getByText('코스').closest('a')).toHaveClass('border-point')
    expect(screen.getByText('지점').closest('a')).not.toHaveClass('border-point')
  })

  it('/points에서 "지점" 탭이 활성(강조) 상태', () => {
    renderTabs('/points')
    expect(screen.getByText('지점').closest('a')).toHaveClass('border-point')
    expect(screen.getByText('코스').closest('a')).not.toHaveClass('border-point')
  })
})
