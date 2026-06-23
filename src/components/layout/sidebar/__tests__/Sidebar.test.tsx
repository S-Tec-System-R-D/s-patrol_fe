import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'

describe('Sidebar 영역 분기', () => {
  it('현장 경로(/zones)에서 ServiceMenus 항목 노출', () => {
    render(
      <MemoryRouter initialEntries={['/zones']}>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText('순찰이력')).toBeInTheDocument()
    expect(screen.getByText('구역/지점')).toBeInTheDocument()
    expect(screen.queryByText('사업장 관리')).not.toBeInTheDocument()
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
  })

  it('본사 경로(/admin/locations)에서 AdminMenus 항목 + ADMIN 뱃지 노출', () => {
    render(
      <MemoryRouter initialEntries={['/admin/locations']}>
        <Sidebar />
      </MemoryRouter>
    )
    expect(screen.getByText('사업장 관리')).toBeInTheDocument()
    expect(screen.getByText('관리자 관리')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
    expect(screen.queryByText('구역/지점')).not.toBeInTheDocument()
  })
})
