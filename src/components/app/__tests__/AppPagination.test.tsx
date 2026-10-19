import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import AppPagination from '@/components/app/AppPagination'
import { pageItems } from '@/components/app/AppPagination.pageItems'

describe('AppPagination', () => {
  it('첫 페이지 → "1–10 / 전체 25개 항목" 표시 + 이전 비활성, 다음 활성', () => {
    render(
      <AppPagination
        pageIndex={0}
        pageSize={10}
        total={25}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    )
    expect(screen.getByText('1–10 / 전체 25개 항목')).toBeInTheDocument()
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
    expect(screen.getByLabelText('다음 페이지')).toBeEnabled()
  })

  it('마지막 페이지 → 다음 비활성, 이전 활성', () => {
    render(
      <AppPagination
        pageIndex={2}
        pageSize={10}
        total={25}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    )
    expect(screen.getByText('21–25 / 전체 25개 항목')).toBeInTheDocument()
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
    expect(screen.getByLabelText('이전 페이지')).toBeEnabled()
  })

  it('다음 페이지 클릭 시 onPageChange(pageIndex + 1) 호출', async () => {
    const onPageChange = vi.fn()
    render(
      <AppPagination
        pageIndex={0}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
        onPageSizeChange={() => {}}
      />
    )
    await userEvent.click(screen.getByLabelText('다음 페이지'))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('페이지당 행 수 변경 시 onPageSizeChange 호출', async () => {
    const onPageSizeChange = vi.fn()
    render(
      <AppPagination
        pageIndex={0}
        pageSize={10}
        total={25}
        onPageChange={() => {}}
        onPageSizeChange={onPageSizeChange}
      />
    )
    await userEvent.click(screen.getByRole('combobox', { name: '페이지당 행 수' }))
    await userEvent.click(await screen.findByRole('option', { name: '25' }))
    expect(onPageSizeChange).toHaveBeenCalledWith(25)
  })

  it('0건 → "0 / 전체 0개 항목" + 이전/다음 모두 비활성', () => {
    render(
      <AppPagination
        pageIndex={0}
        pageSize={10}
        total={0}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    )
    expect(screen.getByText('0–0 / 전체 0개 항목')).toBeInTheDocument()
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
  })
})

/**
 * 🔴 **페이지 번호 버튼** (사용자 요청 2026-10-19). 화살표만 있어 **몇 페이지가 있는지,
 * 지금 몇 번째인지** 알 수 없었다.
 */
describe('AppPagination — 페이지 번호', () => {
  it('전체 페이지 수만큼 번호가 뜨고 현재 페이지에 aria-current 가 붙는다', () => {
    render(
      <AppPagination
        pageIndex={1}
        pageSize={20}
        total={48}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    )

    // 48 / 20 = 3페이지
    expect(screen.getByRole('button', { name: '1페이지' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3페이지' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2페이지' })).toHaveAttribute('aria-current', 'page')
  })

  it('번호를 누르면 onPageChange(번호 - 1) 로 0-based 로 바꿔 넘긴다', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(
      <AppPagination
        pageIndex={0}
        pageSize={20}
        total={48}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: '3페이지' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('1페이지뿐이면 번호를 1개만 그린다', () => {
    render(
      <AppPagination
        pageIndex={0}
        pageSize={20}
        total={5}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: '1페이지' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '2페이지' })).not.toBeInTheDocument()
  })

  it('0건이면 번호가 없다', () => {
    render(
      <AppPagination
        pageIndex={0}
        pageSize={20}
        total={0}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    )

    // 🔴 `/페이지$/` 는 "이전 페이지"·"다음 페이지" 까지 잡는다 — 숫자로 한정한다
    expect(screen.queryByRole('button', { name: /^\d+페이지$/ })).not.toBeInTheDocument()
  })
})

describe('pageItems — 🔴 전부 그리지 않는다', () => {
  it('페이지가 적으면 전부 그린다', () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3])
  })

  it('많으면 양끝 + 현재 주변만 두고 나머지는 … 다', () => {
    expect(pageItems(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20])
  })

  it('🔴 한 칸만 비면 … 대신 그 번호를 넣는다 — `1 … 3` 은 `1 2 3` 보다 길다', () => {
    expect(pageItems(3, 10)).toEqual([1, 2, 3, 4, '…', 10])
  })

  it('경계 — 0페이지·1페이지', () => {
    expect(pageItems(1, 0)).toEqual([])
    expect(pageItems(1, 1)).toEqual([1])
  })
})
