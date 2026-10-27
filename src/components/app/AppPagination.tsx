import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import AppSelect from '@/components/app/AppSelect'

import { pageItems } from './AppPagination.pageItems'

interface AppPaginationProps {
  /** 0-based 현재 페이지 인덱스 */
  pageIndex: number
  pageSize: number
  total: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

/**
 * 리디자인 페이지네이션 — 페이지당 행 수 선택 + 현재 범위 표시 + **페이지 번호** + 이전/다음.
 * 테이블 라이브러리 비의존 — 상태는 소비 측이 들고 콜백으로만 반영한다.
 *
 * 🔴 **미선택 버튼·화살표에 `bg-card` 를 준다**(사용자 요청 2026-10-19). 배경 없이 두면
 * 페이지 배경과 같은 색이라 **테두리만 떠 있는 것처럼** 보였다. ⚠️ 리터럴 `bg-white` 가
 * 아니라 **`bg-card` 다** — 다크 모드에서 흰 버튼이 남으면 안 된다(`index.css` 의 `.dark`).
 *
 * 🔴 **번호 버튼을 넣었다**(사용자 요청 2026-10-19). 리디자인 초안은 화살표만 뒀는데,
 * 48건·3페이지에서 **몇 페이지가 있는지, 지금 몇 번째인지** 화살표만으로는 알 수 없었다.
 * 범위 표시(`21–40 / 전체 48개 항목`)가 그것을 대신한다고 봤지만 **현재 위치만 말하고
 * 전체 페이지 수는 말하지 않는다.**
 */
const AppPagination = ({
  pageIndex,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: AppPaginationProps) => {
  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)
  const canPrev = pageIndex > 0
  const canNext = end < total
  // 🔴 `pageSize` 가 0 이면 나눗셈이 `Infinity` 가 된다 — 방어한다
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">페이지당 행 수</span>
        <AppSelect
          aria-label="페이지당 행 수"
          options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
          value={String(pageSize)}
          onChange={(next) => onPageSizeChange(Number(next))}
          className="h-7 w-auto text-xs"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap tabular-nums">
          {start}–{end} / 전체 {total}개 항목
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPrev}
            className={cn(
              'grid size-7 place-items-center rounded-md border border-border bg-card transition-colors hover:bg-muted',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            <ChevronLeftIcon size={14} />
          </button>

          {/* 🔴 현재 페이지는 **`aria-current="page"`** 다 — 색만으로 전하지 않는다 */}
          {pageItems(pageIndex + 1, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`gap-${i}`} aria-hidden className="px-1">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`${item}페이지`}
                aria-current={item === pageIndex + 1 ? 'page' : undefined}
                onClick={() => onPageChange(item - 1)}
                className={cn(
                  'grid size-7 place-items-center rounded-md border tabular-nums transition-colors',
                  item === pageIndex + 1
                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                    : 'border-border bg-card hover:bg-muted'
                )}
              >
                {item}
              </button>
            )
          )}

          <button
            type="button"
            aria-label="다음 페이지"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNext}
            className={cn(
              'grid size-7 place-items-center rounded-md border border-border bg-card transition-colors hover:bg-muted',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppPagination
