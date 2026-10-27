import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowData,
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

/**
 * 열 단위 추가 클래스 (`spec 026`). `<th>`·`<td>` 양쪽에 붙는다.
 *
 * 🔴 **opt-in 이다** — `meta` 를 주지 않은 열은 지금과 같다. 첫 소비처는 공지 목록의
 * **아이콘 열**(`w-px` 로 내용 폭까지 줄인다) — 자동 레이아웃은 남는 폭을 열마다 나눠 줘서
 * 아이콘 하나짜리 열도 넓어진다.
 */
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

interface AppTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  onRowClick?: (data: TData) => void
  /**
   * 행별 추가 클래스. 상태를 **행 전체**로 드러내야 할 때 쓴다
   * (027: 미사용 지점 배경 톤다운). 셀 단위로는 배경이 끊겨 보인다.
   */
  rowClassName?: (data: TData) => string
  searchable?: boolean
  /**
   * 좁은 폭(`xl` 미만)에서 행 하나를 그리는 **카드 렌더**. `spec 030`.
   *
   * 🔴 **opt-in 이다 — 주지 않으면 아무것도 바뀌지 않는다.** 소비처가 7곳인데 그중
   * **카드 안에 들어 있는 표**(`CoursePatrolLog` 코스 상세 · `DeploymentHistoryTabs`
   * 배치 이력)가 자동으로 카드가 되면 **카드 안에 카드**가 생긴다. `/users` 도 제외 —
   * 400px 고정 패널이 그대로라 카드가 들어갈 폭이 안 남는다(OQ-030-A).
   * ⚠️ (030 당시 근거) `/users` 는 `spec 038` 에서 카드를 붙였고, `DeploymentHistoryTabs` 는 `spec 039`
   * 에서 `DeploymentBoard`(카드 밖 표)가 됐다. opt-in 원칙은 그대로다.
   *
   * 🔴 **CSS 로 분기한다**(`hidden xl:block` / `xl:hidden`). JS 로 폭을 재서 하나만
   * 그리면 ① 첫 렌더에 깜빡이고 ② 테스트·SSR 에서 폭이 0이라 **항상 카드**가 된다.
   * DOM 이 두 벌이 되지만 행 수는 페이지당 20~100 이라 감당된다.
   */
  renderCard?: (data: TData) => React.ReactNode
  /** 페이지당 행 수. 기본 10. controlled `pagination` 미지정 시에만 사용. */
  pageSize?: number
  /**
   * true면 내장 페이지네이션 footer를 숨긴다 (화면이 `AppPagination` 으로 직접 대체할 때).
   * 기본 false.
   *
   * 🔴🔴 **이 값은 "페이징의 주인이 화면" 이라는 선언이다**(2026-10-19 교정). 그래서
   * `manualPagination: true` 를 함께 건다 — **클라이언트 페이징을 끈다.**
   *
   * ⚠️ **전에는 footer 만 숨겼다.** 그러면 화면이 서버에서 20·50건을 받아 와도 `AppTable` 이
   * **기본 `pageSize = 10` 으로 잘라** 10행만 그렸고, footer 는 숨겨져 있어 **나머지로 갈
   * 수단도 없었다.** `AppPagination` 은 `1–20 / 전체 48개 항목` 이라고 적는데 표에는 10행만
   * 있는 상태다 — **숫자와 화면이 어긋나 있었다.**
   * 🔴 **3개 화면이 그 상태였다**: 코스 순찰이력 목록 · 지점 목록 · 코스 목록.
   * (나머지 4곳은 `pagination` 을 함께 넘겨 `pageSize` 가 실려 우연히 정상이었다.)
   * 🔴 **고치는 자리를 화면이 아니라 여기로 잡았다** — 화면마다 `pageSize` 를 넘기게 하면
   * 다음 화면이 또 빠뜨린다. 데이터가 이미 페이징돼 왔다면 **자르지 않는 것이 맞다.**
   */
  hidePagination?: boolean
  /** controlled pagination. 미지정 시 uncontrolled(내장 상태) 동작. */
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
}

const AppTable = <TData,>({
  data,
  columns,
  searchable,
  onRowClick,
  rowClassName,
  renderCard,
  pageSize = 10,
  hidePagination = false,
  pagination,
  onPaginationChange,
}: AppTableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const isPaginationControlled = pagination !== undefined

  // TanStack Table의 useReactTable은 메모이즈 불가한 함수를 반환 — React Compiler skip 경고가 라이브러리 한계이므로 의도적 disable.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      ...(isPaginationControlled && { pagination }),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    ...(isPaginationControlled && { onPaginationChange }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    /* 🔴 **화면이 페이징의 주인이면 클라이언트 페이징을 끈다**(`hidePagination` 주석 참조).
       데이터가 이미 서버에서 잘려 왔으므로 또 자르면 **받은 것보다 적게 보인다** */
    ...(hidePagination && { manualPagination: true }),
    ...(!isPaginationControlled && { initialState: { pagination: { pageSize } } }),
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

      {/* 테이블 — 🔴 `renderCard` 를 받은 화면만 `xl` 이상으로 제한한다. 받지 않은
          소비처는 **클래스조차 붙지 않아** 지금과 완전히 같다(`spec 030` 제약 2).
          🔴 `overflow-x-auto` — 카드가 없는 표가 좁은 폭에서 문서를 넓히지 않고 상자 안에서만 스크롤한다(`spec 053`).
          `relative` 가 없으면 셀 안 `sr-only`(absolute)가 상자를 빠져나가 문서를 다시 넓힌다 */}
      <div className={`relative border rounded-sm overflow-x-auto ${renderCard ? 'hidden xl:block' : ''}`}>
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
                      ${header.column.columnDef.meta?.className ?? ''}
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
          <tbody className="bg-card">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                /* 🔴 **키보드로도 열려야 한다**(OQ-999-A, `047`) — `tabIndex` + Enter/Space. `CheckDetailTable`(036) 과 같다.
                   `onRowClick` 이 없으면 아무것도 걸지 않는다(눌릴 것처럼 보이지 않게) */
                <tr
                  key={row.id}
                  className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${onRowClick ? 'cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring' : ''} ${rowClassName?.(row.original) ?? ''}`}
                  onClick={() => onRowClick?.(row.original)}
                  {...(onRowClick && {
                    tabIndex: 0,
                    onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
                      // 행 안쪽 버튼 · 링크에서 누른 키는 그쪽 몫이다
                      if (event.target !== event.currentTarget) return
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      // Space 는 페이지를 스크롤한다 — 행을 여는 동안은 막는다
                      event.preventDefault()
                      onRowClick(row.original)
                    },
                  })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`text-body font-normal px-3 py-3 ${cell.column.columnDef.meta?.className ?? ''}`}
                    >
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

      {/* 카드 — 좁은 폭(`xl` 미만) 전용.
          🔴 **행을 `data` 가 아니라 `table.getRowModel()` 에서 가져온다.** `data` 를 직접
          돌면 정렬·페이지가 **카드에서만 안 먹어** 테이블과 카드가 서로 다른 것을 보여준다.
          🔴 **클릭·톤다운은 테이블과 같은 함수**(`onRowClick`·`rowClassName`)를 쓴다 —
          두 벌로 갈리면 한쪽만 고쳐진다. */}
      {renderCard && (
        <div className="flex flex-col gap-2 xl:hidden">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => {
              const extra = rowClassName?.(row.original) ?? ''
              /* 🔴 **카드는 `button` 이다**(`div onClick` 이 아니다). 키보드로 누를 수
                 있어야 한다 — 기존 테이블 행(`tr onClick`)은 그 빚이 있지만, 새로 만드는
                 카드까지 같은 빚을 지지 않는다(`patterns.md` 반응형 목록 규약) */
              return onRowClick ? (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onRowClick(row.original)}
                  className={`rounded-sm border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50 ${extra}`}
                >
                  {renderCard(row.original)}
                </button>
              ) : (
                <div
                  key={row.id}
                  className={`rounded-sm border border-border bg-card p-3 ${extra}`}
                >
                  {renderCard(row.original)}
                </div>
              )
            })
          ) : (
            /* 테이블의 0건 문구는 `<td colSpan>` 안에 있어 카드 모드에서는 보이지 않는다 */
            <div className="rounded-sm border border-border bg-card py-10 text-center text-muted-foreground">
              데이터가 없습니다
            </div>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {!hidePagination && <TablePagination table={table} />}
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
