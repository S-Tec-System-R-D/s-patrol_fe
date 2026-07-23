import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'

describe('Sidebar (본사 전용)', () => {
  it('AdminMenus 항목 + ADMIN 뱃지 렌더', () => {
    render(
      <MemoryRouter initialEntries={['/admin/locations']}>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText('사업장 관리')).toBeInTheDocument()
    expect(screen.getByText('관리자 관리')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })
})
