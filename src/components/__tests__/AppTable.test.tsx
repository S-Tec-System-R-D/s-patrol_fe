import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import type { ColumnDef } from '@tanstack/react-table'
import AppTable from '@/components/AppTable'

interface Row {
  id: number
  name: string
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
]

const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `row-${i + 1}` }))

describe('AppTable 페이지네이션', () => {
  it('15행 + pageSize 10 → 페이지 1/2 표시 + 첫 페이지 "이전" 비활성', () => {
    render(<AppTable data={makeRows(15)} columns={columns} pageSize={10} />)
    expect(screen.getByText('전체 15건')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
    expect(screen.getByLabelText('다음 페이지')).toBeEnabled()
  })

  it('"다음" 클릭 시 페이지 2로 이동 + 마지막 페이지 "다음" 비활성', async () => {
    render(<AppTable data={makeRows(15)} columns={columns} pageSize={10} />)
    await userEvent.click(screen.getByLabelText('다음 페이지'))
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
    expect(screen.getByLabelText('이전 페이지')).toBeEnabled()
  })

  it('0행 → "전체 0건" + 페이지 0/1 노출 + 이전/다음 모두 비활성', () => {
    render(<AppTable data={[]} columns={columns} pageSize={10} />)
    expect(screen.getByText('전체 0건')).toBeInTheDocument()
    expect(screen.getByText('0 / 1')).toBeInTheDocument()
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
  })
})
