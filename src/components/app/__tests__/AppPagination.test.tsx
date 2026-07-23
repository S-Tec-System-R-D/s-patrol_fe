import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import AppPagination from '@/components/app/AppPagination'

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
    await userEvent.selectOptions(screen.getByRole('combobox'), '25')
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
