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
 */
const AppFilterButton = forwardRef<HTMLButtonElement, AppFilterButtonProps>(
  ({ icon: Icon, label, active, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-active={active}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted',
          'data-[active=true]:border-point data-[active=true]:bg-point-bg data-[active=true]:text-point-foreground',
          className
        )}
        {...props}
      >
        {Icon && <Icon size={14} strokeWidth={1.75} />}
        <span>{label}</span>
        <ChevronDownIcon size={14} strokeWidth={1.75} className="text-muted-foreground" />
      </button>
    )
  }
)
AppFilterButton.displayName = 'AppFilterButton'

export default AppFilterButton
