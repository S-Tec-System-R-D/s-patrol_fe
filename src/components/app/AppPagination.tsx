import { cn } from '@/lib/utils'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  type LucideIcon,
} from 'lucide-react'
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

/** 번호 · 화살표 한 칸 — 테두리 없는 30px 칸 */
const cell =
  'place-items-center h-[30px] min-w-[30px] rounded-[7px] px-1.5 font-medium tabular-nums text-foreground/75 transition-colors hover:bg-muted hover:text-foreground cursor-pointer disabled:pointer-events-none disabled:opacity-35'

interface ArrowProps {
  icon: LucideIcon
  label: string
  disabled: boolean
  onClick: () => void
  /** 넓은 화면(`xl`)에서만 보이는 칸 — 처음 · 마지막 */
  wideOnly?: boolean
}

const Arrow = ({ icon: Icon, label, disabled, onClick, wideOnly }: ArrowProps) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={cn(cell, wideOnly ? 'hidden xl:grid' : 'grid')}
  >
    <Icon size={14} />
  </button>
)

/**
 * 페이지 이동 — 왼쪽 `전체 N개 항목` + 페이지당 행 수 / 오른쪽 `현재 / 전체 페이지` + 번호.
 * 테이블 라이브러리 비의존 — 상태는 소비 측이 들고 콜백으로만 반영한다.
 *
 * 🔄 **`spec 083`**(사용자 결정 2026-11-20):
 * - 넓은 화면(`xl` 이상) = `«` `‹` **번호 다섯 개**(지금 페이지가 가운데) `›` `»` · 그보다 좁으면 `‹` `›` 만.
 * - 테두리 없는 칸 — 지금 페이지는 옅은 파랑 바탕 + 파란 숫자. 갈 수 없는 화살표는 흐리게.
 * - 범위 표시(`21–40`)를 없애고 `현재 / 전체 페이지` 를 둔다 — 번호가 다섯 개만 보여 전체 쪽수를 글자로 말한다.
 *
 * 🔴 현재 페이지는 **`aria-current="page"`** 다 — 색만으로 전하지 않는다.
 */
const AppPagination = ({
  pageIndex,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: AppPaginationProps) => {
  // 🔴 `pageSize` 가 0 이면 나눗셈이 `Infinity` 가 된다 — 방어한다
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0
  const current = totalPages === 0 ? 0 : pageIndex + 1
  const canPrev = pageIndex > 0
  const canNext = current < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap tabular-nums">전체 {total}개 항목</span>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">페이지당 행 수</span>
          <AppSelect
            aria-label="페이지당 행 수"
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            value={String(pageSize)}
            onChange={(next) => onPageSizeChange(Number(next))}
            className="h-[30px] w-auto text-xs"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap tabular-nums">
          {current} / {totalPages} 페이지
        </span>
        <div className="flex items-center gap-0.5">
          <Arrow icon={ChevronsLeftIcon} label="첫 페이지" disabled={!canPrev} onClick={() => onPageChange(0)} wideOnly />
          <Arrow icon={ChevronLeftIcon} label="이전 페이지" disabled={!canPrev} onClick={() => onPageChange(pageIndex - 1)} />

          {pageItems(current, totalPages).map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`${item}페이지`}
              aria-current={item === current ? 'page' : undefined}
              onClick={() => onPageChange(item - 1)}
              className={cn(
                cell,
                'hidden xl:grid',
                item === current && 'bg-point-bg font-semibold text-point hover:bg-point-bg hover:text-point'
              )}
            >
              {item}
            </button>
          ))}

          <Arrow icon={ChevronRightIcon} label="다음 페이지" disabled={!canNext} onClick={() => onPageChange(pageIndex + 1)} />
          <Arrow
            icon={ChevronsRightIcon}
            label="마지막 페이지"
            disabled={!canNext}
            onClick={() => onPageChange(totalPages - 1)}
            wideOnly
          />
        </div>
      </div>
    </div>
  )
}

export default AppPagination
