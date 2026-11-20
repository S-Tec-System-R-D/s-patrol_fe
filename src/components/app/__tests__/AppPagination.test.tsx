import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import AppPagination from '@/components/app/AppPagination'
import { pageItems } from '@/components/app/AppPagination.pageItems'

const renderPager = (props: { pageIndex: number; pageSize: number; total: number }) => {
  const onPageChange = vi.fn()
  const onPageSizeChange = vi.fn()
  render(<AppPagination {...props} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />)
  return { onPageChange, onPageSizeChange }
}

describe('AppPagination', () => {
  it('첫 페이지 → "전체 25개 항목" · "1 / 3 페이지" + 처음 · 이전 비활성, 다음 · 마지막 활성', () => {
    renderPager({ pageIndex: 0, pageSize: 10, total: 25 })

    expect(screen.getByText('전체 25개 항목')).toBeInTheDocument()
    expect(screen.getByText('1 / 3 페이지')).toBeInTheDocument()
    expect(screen.getByLabelText('첫 페이지')).toBeDisabled()
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
    expect(screen.getByLabelText('다음 페이지')).toBeEnabled()
    expect(screen.getByLabelText('마지막 페이지')).toBeEnabled()
  })

  it('마지막 페이지 → 다음 · 마지막 비활성, 이전 활성', () => {
    renderPager({ pageIndex: 2, pageSize: 10, total: 25 })

    expect(screen.getByText('3 / 3 페이지')).toBeInTheDocument()
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
    expect(screen.getByLabelText('마지막 페이지')).toBeDisabled()
    expect(screen.getByLabelText('이전 페이지')).toBeEnabled()
  })

  it('다음 페이지 클릭 시 onPageChange(pageIndex + 1) 호출', async () => {
    const { onPageChange } = renderPager({ pageIndex: 0, pageSize: 10, total: 25 })

    await userEvent.click(screen.getByLabelText('다음 페이지'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('페이지당 행 수 변경 시 onPageSizeChange 호출', async () => {
    const { onPageSizeChange } = renderPager({ pageIndex: 0, pageSize: 10, total: 25 })

    await userEvent.click(screen.getByRole('combobox', { name: '페이지당 행 수' }))
    await userEvent.click(await screen.findByRole('option', { name: '25' }))
    expect(onPageSizeChange).toHaveBeenCalledWith(25)
  })

  it('0건 → "전체 0개 항목" · "0 / 0 페이지" + 이전/다음 모두 비활성', () => {
    renderPager({ pageIndex: 0, pageSize: 10, total: 0 })

    expect(screen.getByText('전체 0개 항목')).toBeInTheDocument()
    expect(screen.getByText('0 / 0 페이지')).toBeInTheDocument()
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
  })
})

/**
 * 🔴 **페이지 번호 버튼** (사용자 요청 2026-10-19). 화살표만 있어 **몇 페이지가 있는지,
 * 지금 몇 번째인지** 알 수 없었다. 🔄 `spec 083`: 번호는 지금 페이지를 가운데에 둔 다섯 개 ·
 * 처음 · 마지막 버튼 추가 · 전체 쪽수는 `현재 / 전체 페이지` 글자가 말한다.
 */
describe('AppPagination — 페이지 번호', () => {
  const numberButtons = () =>
    screen.getAllByRole('button', { name: /^[0-9]+페이지$/ }).map((button) => button.textContent)

  it('쪽수가 적으면 있는 만큼 번호가 뜨고 현재 페이지에 aria-current 가 붙는다', () => {
    renderPager({ pageIndex: 1, pageSize: 20, total: 48 })

    // 48 / 20 = 3페이지
    expect(numberButtons()).toEqual(['1', '2', '3'])
    expect(screen.getByRole('button', { name: '2페이지' })).toHaveAttribute('aria-current', 'page')
  })

  it('번호를 누르면 onPageChange(번호 - 1) 로 0-based 로 바꿔 넘긴다', async () => {
    const { onPageChange } = renderPager({ pageIndex: 0, pageSize: 20, total: 48 })

    await userEvent.click(screen.getByRole('button', { name: '3페이지' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('🔴 쪽수가 많으면 지금 페이지를 가운데에 둔 다섯 개만 — 7쪽이면 5 6 [7] 8 9', () => {
    renderPager({ pageIndex: 6, pageSize: 10, total: 200 })

    expect(numberButtons()).toEqual(['5', '6', '7', '8', '9'])
    expect(screen.getByRole('button', { name: '7페이지' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('7 / 20 페이지')).toBeInTheDocument()
  })

  it('🔴 처음 · 마지막 버튼은 0 · 마지막 인덱스로 보낸다', async () => {
    const { onPageChange } = renderPager({ pageIndex: 6, pageSize: 10, total: 200 })

    await userEvent.click(screen.getByLabelText('첫 페이지'))
    expect(onPageChange).toHaveBeenLastCalledWith(0)
    await userEvent.click(screen.getByLabelText('마지막 페이지'))
    expect(onPageChange).toHaveBeenLastCalledWith(19)
  })

  it('🔴 번호와 처음 · 마지막은 넓은 화면에서만, 이전 · 다음은 늘 보인다', () => {
    renderPager({ pageIndex: 0, pageSize: 10, total: 200 })

    expect(screen.getByRole('button', { name: '1페이지' })).toHaveClass('hidden', 'xl:grid')
    expect(screen.getByLabelText('첫 페이지')).toHaveClass('hidden', 'xl:grid')
    expect(screen.getByLabelText('마지막 페이지')).toHaveClass('hidden', 'xl:grid')
    expect(screen.getByLabelText('이전 페이지')).not.toHaveClass('hidden')
    expect(screen.getByLabelText('다음 페이지')).not.toHaveClass('hidden')
  })

  it('1페이지뿐이면 번호를 1개만 그린다', () => {
    renderPager({ pageIndex: 0, pageSize: 20, total: 5 })

    expect(numberButtons()).toEqual(['1'])
  })

  it('0건이면 번호가 없다', () => {
    renderPager({ pageIndex: 0, pageSize: 20, total: 0 })

    // 🔴 `/페이지$/` 는 "이전 페이지"·"다음 페이지" 까지 잡는다 — 숫자로 한정한다
    expect(screen.queryByRole('button', { name: /^[0-9]+페이지$/ })).not.toBeInTheDocument()
  })
})

describe('pageItems — 지금 페이지를 가운데에 둔 다섯 개 (spec 083)', () => {
  it('페이지가 다섯보다 적으면 있는 만큼만', () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3])
    expect(pageItems(3, 3)).toEqual([1, 2, 3])
  })

  it('가운데 — 7쪽이면 5 6 7 8 9', () => {
    expect(pageItems(7, 20)).toEqual([5, 6, 7, 8, 9])
    expect(pageItems(10, 20)).toEqual([8, 9, 10, 11, 12])
  })

  it('🔴 앞이 모자라면 뒤로 채운다 — 1 · 2쪽에서도 다섯 개', () => {
    expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(2, 20)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(3, 20)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(4, 20)).toEqual([2, 3, 4, 5, 6])
  })

  it('🔴 뒤가 모자라면 앞으로 채운다 — 마지막 쪽에서도 다섯 개', () => {
    expect(pageItems(20, 20)).toEqual([16, 17, 18, 19, 20])
    expect(pageItems(19, 20)).toEqual([16, 17, 18, 19, 20])
    expect(pageItems(17, 20)).toEqual([15, 16, 17, 18, 19])
  })

  it('정확히 다섯 쪽', () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageItems(5, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('경계 — 0페이지 · 1페이지 · 0건의 현재 0', () => {
    expect(pageItems(1, 0)).toEqual([])
    expect(pageItems(0, 0)).toEqual([])
    expect(pageItems(1, 1)).toEqual([1])
  })
})
