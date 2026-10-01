import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import PatrolZonesPage from '@/pages/service/patrol/zones/PatrolZonesPage'

/** 현재 쿼리스트링을 화면에 노출시켜 URL 반영을 검증한다. */
const LocationProbe = () => {
  const { search } = useLocation()
  return <div data-testid="search">{search}</div>
}

const renderPage = (initialUrl = '/patrol/zones') =>
  render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route
          path="/patrol/zones"
          element={
            <>
              <PatrolZonesPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )

const search = () => screen.getByTestId('search').textContent ?? ''
const rowCount = () => within(screen.getByRole('table')).getAllByRole('row').length - 1

describe('PatrolZonesPage 필터', () => {
  it('쿼리 없이 진입하면 전체 목록이 보인다', () => {
    renderPage()
    expect(rowCount()).toBeGreaterThan(0)
    expect(screen.getByLabelText('코스')).toHaveTextContent('전체')
  })

  it('result 쿼리로 직접 진입하면 그 상태가 복원된다', () => {
    renderPage('/patrol/zones?result=INCOMPLETE')

    expect(screen.getByLabelText('결과')).toHaveTextContent('미완료')
    expect(screen.getByLabelText('결과')).toHaveAttribute('data-active', 'true')
    const badges = within(screen.getByRole('table')).getAllByText('미완료')
    expect(badges).toHaveLength(rowCount())
  })

  it('courseId 쿼리로 직접 진입하면 해당 코스만 보인다', () => {
    renderPage('/patrol/zones?courseId=C%EB%8F%99%20%EC%88%9C%EC%B0%B0%EA%B5%AC%EC%97%AD')

    expect(screen.getByLabelText('코스')).toHaveTextContent('C동 순찰구역')
    const cells = within(screen.getByRole('table')).getAllByText('C동 순찰구역')
    expect(cells).toHaveLength(rowCount())
  })

  it('두 조건을 함께 넘기면 AND로 좁혀진다', () => {
    renderPage(
      '/patrol/zones?courseId=C%EB%8F%99%20%EC%88%9C%EC%B0%B0%EA%B5%AC%EC%97%AD&result=COMPLETE'
    )

    const table = within(screen.getByRole('table'))
    const visible = rowCount()
    expect(visible).toBeGreaterThan(0)
    expect(table.getAllByText('C동 순찰구역')).toHaveLength(visible)
    expect(table.getAllByText('완료')).toHaveLength(visible)
  })

  it('옵션을 선택하면 URL에 반영된다', async () => {
    renderPage()

    await userEvent.click(screen.getByLabelText('결과'))
    await userEvent.click(await screen.findByRole('option', { name: '완료' }))

    expect(search()).toContain('result=COMPLETE')
  })

  it('"전체"를 선택하면 해당 키가 URL에서 제거된다', async () => {
    renderPage('/patrol/zones?result=COMPLETE')
    expect(search()).toContain('result=COMPLETE')

    await userEvent.click(screen.getByLabelText('결과'))
    await userEvent.click(await screen.findByRole('option', { name: '전체' }))

    expect(search()).not.toContain('result=')
  })

  it('조건에 맞는 행이 없으면 빈 상태가 보인다', () => {
    renderPage('/patrol/zones?courseId=%EC%97%86%EB%8A%94%20%EC%BD%94%EC%8A%A4')

    expect(screen.getByText('조건에 맞는 순찰이력이 없습니다')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('알 수 없는 result 값으로 진입해도 목록이 비지 않는다', () => {
    renderPage('/patrol/zones?result=GARBAGE')
    expect(rowCount()).toBeGreaterThan(0)
  })
})
