import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type Table,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import AppButton from '@/components/app/AppButton'

interface AppTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  onRowClick?: (data: TData) => void
  searchable?: boolean
  /** 페이지당 행 수. 기본 10. */
  pageSize?: number
}

const AppTable = <TData,>({
  data,
  columns,
  searchable,
  onRowClick,
  pageSize = 10,
}: AppTableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // TanStack Table의 useReactTable은 메모이즈 불가한 함수를 반환 — React Compiler skip 경고가 라이브러리 한계이므로 의도적 disable.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 검색 */}
      {searchable && (
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="검색"
          className="w-64 px-3 py-2 text-sm border rounded-sm bg-background outline-none focus:border-ring"
        />
      )}

      {/* 테이블 */}
      <div className="border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`
                      text-left text-xs px-3 py-3 font-medium text-muted-foreground
                      ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-foreground' : ''}
                    `}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon sorted={header.column.getIsSorted()} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-background">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="text-[13px] font-normal px-3 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted-foreground py-10">
                  데이터가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <TablePagination table={table} />
    </div>
  )
}

export default AppTable

const SortIcon = ({ sorted }: { sorted: false | 'asc' | 'desc' }) => {
  if (sorted === 'asc') return <ChevronUpIcon size={14} className="text-primary" />
  if (sorted === 'desc') return <ChevronDownIcon size={14} className="text-primary" />
  return <ChevronsUpDownIcon size={14} className="text-muted-foreground" />
}

/**
 * 페이지네이션 footer.
 * - 1-based 표시 (`pageIndex + 1` / `pageCount`)
 * - 첫/마지막 페이지에서 이전/다음 버튼 비활성
 * - 데이터 0건 또는 1페이지만 있는 경우에도 "전체 N건"은 노출
 */
const TablePagination = <TData,>({ table }: { table: Table<TData> }) => {
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()
  const total = table.getFilteredRowModel().rows.length
  const currentPage = pageCount === 0 ? 0 : pageIndex + 1

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>전체 {total}건</span>
      <div className="flex items-center gap-2">
        <AppButton
          variant="sub"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="이전 페이지"
        >
          <ChevronLeftIcon size={14} />
          이전
        </AppButton>
        <span className="px-2 font-medium text-foreground tabular-nums">
          {currentPage} / {Math.max(pageCount, 1)}
        </span>
        <AppButton
          variant="sub"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="다음 페이지"
        >
          다음
          <ChevronRightIcon size={14} />
        </AppButton>
      </div>
    </div>
  )
}
