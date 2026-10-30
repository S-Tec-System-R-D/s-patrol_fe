import { cn } from '@/lib/utils'
import { ChevronDownIcon, type LucideIcon } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface AppFilterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  label: string
  active?: boolean
}

/**
 * 필터 드롭다운/팝오버 트리거 시각. 콘텐츠 조립(Popover/DropdownMenu)은 소비 측 책임.
 * radix Trigger `asChild`로 감쌀 수 있도록 ref를 전달한다.
 *
 * 🔴 **미선택 톤 · 아이콘을 `AppSelect` 필터 트리거와 맞춘다**(사용자 지적 2026-10-30) — 코스/지점 필터만
 * 글자가 진한 먹 · 아이콘 14px 불투명이라, 근무자 · 순찰이력 필터(연한 회색 · 16px 60%)와 달라 보였다.
 * `AppSelect` 는 2026-10-20 에 맞췄는데 이 버튼은 그때 빠졌다. 미선택 = `active === false`.
 */
const AppFilterButton = forwardRef<HTMLButtonElement, AppFilterButtonProps>(
  ({ icon: Icon, label, active, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-active={active}
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 text-body text-foreground transition-colors hover:bg-muted',
          'data-[active=false]:text-muted-foreground',
          'data-[active=true]:border-point data-[active=true]:bg-point-bg data-[active=true]:text-point-foreground',
          className
        )}
        {...props}
      >
        {Icon && <Icon size={16} strokeWidth={1.75} className="shrink-0 opacity-60" />}
        <span>{label}</span>
        <ChevronDownIcon size={16} strokeWidth={1.75} className="shrink-0 opacity-60" />
      </button>
    )
  }
)
AppFilterButton.displayName = 'AppFilterButton'

export default AppFilterButton
