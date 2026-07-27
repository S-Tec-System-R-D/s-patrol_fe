import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NoticeDetailPage from '../NoticeDetailPage'

const renderAt = (id: string) =>
  render(
    <MemoryRouter initialEntries={[`/notice/${id}`]}>
      <Routes>
        <Route path="/notice/:id" element={<NoticeDetailPage />} />
      </Routes>
    </MemoryRouter>
  )

describe('NoticeDetailPage', () => {
  it('존재하지 않는 id 접근 시 AppEmpty 렌더', () => {
    renderAt('does-not-exist')

    expect(screen.getByText('공지를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('존재하는 id 접근 시 공지 상세 렌더', () => {
    renderAt('4')

    expect(screen.getByText('6월 정기 순찰 점검 안내')).toBeInTheDocument()
  })
})
