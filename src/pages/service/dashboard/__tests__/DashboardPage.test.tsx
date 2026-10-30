import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import DashboardKpiRow from '@/features/dashboard/components/DashboardKpiRow'
import DashboardPage from '../DashboardPage'

/**
 * `/dashboard` — `spec 067`(API 없음, 고정 데이터). 정렬 · 링크 · 상태 3종 · 0 KPI 색.
 */

const LocationProbe = () => {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

const renderPage = (entry = '/dashboard') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )

describe('DashboardPage', () => {
  it('KPI 4칸 — 진행 중 칸은 없고, 누를 수 없다(링크 없음)', () => {
    renderPage()
    for (const label of ['오늘 완료', '오늘 미완료', '시간초과', '배치 대기']) {
      expect(screen.getByText(label, { selector: 'p' }).closest('a')).toBeNull()
    }
    expect(screen.queryByText('진행 중', { selector: 'p' })).toBeNull()
  })

  it('진행 중 카드 — 시간초과 코스가 맨 위, 카드는 회차 상세로 간다', () => {
    renderPage()
    const section = screen.getByRole('heading', { name: '진행 중인 순찰' }).closest('section')!
    const cards = within(section).getAllByRole('link')
    expect(cards).toHaveLength(4)
    expect(within(cards[0]).getByRole('heading')).toHaveTextContent('C코스')
    expect(cards[0]).toHaveTextContent('시간초과 +13분')
    expect(cards[0]).toHaveAttribute('href', '/patrol/zones/103')
    // A코스 18/30 → B코스 23/40 → 야간코스 2/25
    expect(cards.slice(1).map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'A코스',
      'B코스',
      '야간코스',
    ])
  })

  it('카드 두 줄 — 지점 수 · 교대 · 다음 지점 · 건너뜀', () => {
    renderPage()
    const card = screen.getByRole('heading', { name: 'B코스' }).closest('a')!
    expect(card).toHaveTextContent('3/5 지점')
    expect(card).toHaveTextContent('교대')
    expect(card).toHaveTextContent('다음: 옥상')
    expect(card).toHaveTextContent('건너뜀 1')
    const steps = within(card).getAllByRole('listitem')
    expect(steps).toHaveLength(5)
    expect(steps[2]).toHaveTextContent('3창고 (건너뜀)')
    expect(steps[4]).toHaveTextContent('5옥상 (다음)')

    const night = screen.getByRole('heading', { name: '야간코스' }).closest('a')!
    expect(night).toHaveTextContent('출발')
    expect(night).toHaveTextContent('0/4 지점')
  })

  it('최근 미완료 · 시간초과 · 공지 — 건수 뱃지 없음 · 행 링크 · 고정 공지만 핀', () => {
    renderPage()
    const history = screen.getByRole('heading', { name: '최근 미완료 · 시간초과' }).closest('section')!
    expect(within(history).getByRole('link', { name: /전체 보기/ })).toHaveAttribute('href', '/patrol/points')
    expect(within(history).getByRole('link', { name: /3층/ })).toHaveAttribute('href', '/patrol/points/1000')
    // 처리할 목록이 아니다 — 건수를 세우지 않는다
    expect(within(history).queryByText('5')).toBeNull()
    // 인증을 마친 행은 결과 뱃지 없이 시간초과만 — 이상없음 · 순찰기록이 안 나온다
    expect(within(history).queryByText('이상없음')).toBeNull()
    expect(within(within(history).getByRole('link', { name: /창고/ })).getByText('시간초과')).toBeInTheDocument()

    const notice = screen.getByRole('heading', { name: '공지사항' }).closest('section')!
    expect(within(notice).getAllByLabelText('고정 공지')).toHaveLength(1)
    expect(within(notice).getByRole('link', { name: /사업장 출입 보안 수칙/ })).toHaveAttribute('href', '/notice/5')
  })

  it('KPI 값이 0 이면 색을 빼고, 있으면 미완료 · 시간초과는 danger', () => {
    const { container, unmount } = render(
      <MemoryRouter>
        <DashboardKpiRow kpi={{ completedToday: 0, incompleteToday: 0, overtimeToday: 0, pendingDeployments: 0 }} />
      </MemoryRouter>
    )
    expect(container.querySelector('.bg-danger-bg, .bg-point-bg')).toBeNull()
    unmount()

    const filled = render(
      <MemoryRouter>
        <DashboardKpiRow kpi={{ completedToday: 3, incompleteToday: 1, overtimeToday: 2, pendingDeployments: 0 }} />
      </MemoryRouter>
    )
    expect(filled.container.querySelectorAll('.bg-danger-bg')).toHaveLength(2)
    expect(filled.container.querySelector('.bg-point-bg')).toBeNull()
  })

  it('?preview=empty — 진행 중 없음, 하단은 그대로', () => {
    renderPage('/dashboard?preview=empty')
    expect(screen.getByText('지금 진행 중인 순찰이 없습니다')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '최근 미완료 · 시간초과' })).toBeInTheDocument()
  })

  it('?preview=loading — 스켈레톤', () => {
    renderPage('/dashboard?preview=loading')
    expect(screen.getByLabelText('불러오는 중')).toBeInTheDocument()
    expect(screen.queryByText('지금 진행 중인 순찰이 없습니다')).toBeNull()
  })

  it('?preview=error — 다시 시도하면 정상 화면', async () => {
    renderPage('/dashboard?preview=error')
    expect(screen.getByText('진행 중인 순찰을 불러오지 못했습니다')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(screen.getByRole('heading', { name: 'C코스' })).toBeInTheDocument()
  })
})
