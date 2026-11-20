import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * `outline` = 테두리(검색 칸 · 필터 옆 — 같은 줄의 테두리와 맞춘다) ·
 * `soft` = 옅은 회색 채움(**화면 제목 오른쪽**의 `…` 등 — `spec 083`) ·
 * `ghost` = 테두리 · 바탕 없음(줄 안의 메뉴).
 */
type AppIconButtonVariant = 'outline' | 'soft' | 'ghost'

interface AppIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  iconSize?: number
  variant?: AppIconButtonVariant
}

const variantStyles: Record<AppIconButtonVariant, string> = {
  outline: 'border border-border bg-card text-muted-foreground hover:bg-muted',
  soft: 'bg-muted text-foreground/75 hover:bg-border',
  ghost: 'text-muted-foreground hover:bg-muted',
}

/** 아이콘 하나짜리 버튼 — 30px 네모(`spec 083` — 버튼 · 검색 칸 · 필터와 같은 높이) */
const AppIconButton = ({
  icon: Icon,
  iconSize = 16,
  variant = 'outline',
  className,
  ...props
}: AppIconButtonProps) => {
  return (
    <button
      className={cn(
        'flex size-[30px] shrink-0 items-center justify-center rounded-[7px] hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={1.5} />
    </button>
  )
}

export default AppIconButton
