import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import AppSelect from '@/components/app/AppSelect'

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
 * 리디자인 페이지네이션 — 페이지당 행 수 선택 + 현재 범위 표시 + 이전/다음(페이지 번호 버튼 없음).
 * 테이블 라이브러리 비의존 — 상태는 소비 측이 들고 콜백으로만 반영한다.
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

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>페이지당 행 수</span>
        <AppSelect
          aria-label="페이지당 행 수"
          options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
          value={String(pageSize)}
          onChange={(next) => onPageSizeChange(Number(next))}
          className="h-7 w-auto text-xs"
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          {start}–{end} / 전체 {total}개 항목
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!canPrev}
            className={cn(
              'grid size-7 place-items-center rounded-md border border-border transition-colors hover:bg-muted',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
          >
            <ChevronLeftIcon size={14} />
          </button>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!canNext}
            className={cn(
              'grid size-7 place-items-center rounded-md border border-border transition-colors hover:bg-muted',
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
