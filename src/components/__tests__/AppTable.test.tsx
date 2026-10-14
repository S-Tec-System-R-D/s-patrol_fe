import { describe, expect, it, vi } from 'vitest'
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

/**
 * 카드 모드 (`spec 030` T442).
 *
 * 🔴 **첫 항목이 "prop 없으면 아무것도 안 바뀐다" 인 이유**: `AppTable` 소비처 7곳 중
 * **셋은 대상이 아니다** — `/users` 와 **카드 안에 들어 있는 표 2개**(`CoursePatrolLog`·
 * `DeploymentHistoryTabs`). 자동으로 카드가 되면 카드 안에 카드가 생긴다.
 *
 * ⚠️ 카드 모드에서는 **DOM 에 테이블과 카드가 둘 다 있다**(CSS 로 숨긴다). jsdom 에는
 * 미디어 쿼리가 없으므로 둘 다 조회된다 — 영역을 좁혀(`within`) 확인한다.
 */
describe('AppTable 카드 모드 (spec 030)', () => {
  const renderCard = (row: Row) => <span>카드 {row.name}</span>

  it('🔴 renderCard 를 주지 않으면 카드가 없다 — 기존 소비처는 무변화다', () => {
    render(<AppTable data={makeRows(3)} columns={columns} />)

    expect(screen.queryByText(/^카드 /)).not.toBeInTheDocument()
    // 테이블에 `xl` 분기 클래스도 붙지 않는다
    expect(document.querySelector('[class*="xl:block"]')).toBeNull()
  })

  it('renderCard 를 주면 테이블과 카드가 **둘 다** 그려진다 — 분기는 CSS 가 한다', () => {
    render(<AppTable data={makeRows(2)} columns={columns} renderCard={renderCard} />)

    // 테이블 쪽(행 셀)과 카드 쪽이 같은 행을 그린다
    expect(screen.getByRole('cell', { name: 'row-1' })).toBeInTheDocument()
    expect(screen.getByText('카드 row-1')).toBeInTheDocument()
    expect(document.querySelector('[class*="xl:block"]')).not.toBeNull()
  })

  it('🔴 카드는 `getRowModel` 을 쓴다 — 페이지를 넘기면 카드도 함께 넘어간다', async () => {
    render(
      <AppTable data={makeRows(15)} columns={columns} pageSize={10} renderCard={renderCard} />
    )
    expect(screen.getByText('카드 row-1')).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('다음 페이지'))

    // `data` 를 직접 돌았다면 카드만 1페이지에 남아 테이블과 다른 것을 보여준다
    expect(screen.queryByText('카드 row-1')).not.toBeInTheDocument()
    expect(screen.getByText('카드 row-11')).toBeInTheDocument()
  })

  it('카드 클릭이 onRowClick 을 부른다 — 테이블 행과 같은 함수다', async () => {
    const onRowClick = vi.fn()
    render(
      <AppTable data={makeRows(2)} columns={columns} renderCard={renderCard} onRowClick={onRowClick} />
    )

    await userEvent.click(screen.getByRole('button', { name: '카드 row-2' }))

    expect(onRowClick).toHaveBeenCalledWith({ id: 2, name: 'row-2' })
  })

  it('🔴 카드도 `button` 이라 키보드로 누를 수 있다', async () => {
    const onRowClick = vi.fn()
    render(
      <AppTable data={makeRows(1)} columns={columns} renderCard={renderCard} onRowClick={onRowClick} />
    )

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onRowClick).toHaveBeenCalledTimes(1)
  })

  it('🔴 rowClassName 이 카드에도 걸린다 — 미사용 톤다운이 좁은 폭에서 사라지면 안 된다', () => {
    render(
      <AppTable
        data={makeRows(2)}
        columns={columns}
        renderCard={renderCard}
        onRowClick={vi.fn()}
        rowClassName={(row) => (row.id === 1 ? 'bg-muted/40' : '')}
      />
    )

    expect(screen.getByRole('button', { name: '카드 row-1' })).toHaveClass('bg-muted/40')
    expect(screen.getByRole('button', { name: '카드 row-2' })).not.toHaveClass('bg-muted/40')
  })

  it('0건이면 카드 쪽에도 안내가 뜬다 — 테이블의 문구는 `td` 안이라 보이지 않는다', () => {
    render(<AppTable data={[]} columns={columns} renderCard={renderCard} />)

    expect(screen.getAllByText('데이터가 없습니다')).toHaveLength(2)
  })
})
