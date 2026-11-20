import { cn } from '@/lib/utils'
import { PlusIcon, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

/**
 * 본 프로젝트 표준 버튼 (design-system.md D1).
 * - variant: default / sub / soft / destructive / dash
 * - size: full / fit
 * - icon + iconPosition 내장
 *
 * 🔄 `spec 083`: 높이 30px(`fit` — 검색 칸 · 필터와 같다) · 가로 전체 폭(`full` — 모달의 등록 · 저장)은 36px.
 * 주 버튼은 남색 → 파랑. `soft`(옅은 회색 채움 · 테두리 없음)는 **화면 제목 오른쪽 버튼**용이고,
 * `destructive` 는 옅은 빨강 채움 + 빨간 글자(테두리 없음).
 * 🔴 글자 크기는 임의값(`text-[12px]`)으로 적는다 — 크기 토큰(`text-caption`)은 `tailwind-merge` 가 글자색으로 보고
 * variant 의 색을 지운다(`AppBadge.variants.ts` 와 같은 함정).
 */

type AppButtonVariant = 'default' | 'sub' | 'soft' | 'destructive' | 'dash'
type AppButtonSize = 'full' | 'fit'

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant
  size?: AppButtonSize
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  iconSize?: number
  iconStrokeWidth?: number
}

const variantStyles: Record<AppButtonVariant, string> = {
  default: 'bg-point text-white hover:bg-point/90',
  sub: 'bg-card text-foreground border border-border hover:bg-muted',
  soft: 'bg-muted text-foreground hover:bg-border',
  destructive: 'bg-danger-bg text-danger-foreground hover:bg-danger/15',
  dash: 'bg-none border-1 border-dashed text-muted-foreground hover:border-point hover:bg-point-bg hover:text-point',
}

const sizeStyles: Record<AppButtonSize, string> = {
  full: 'w-full h-9 px-4 text-[13px]',
  fit: 'w-fit h-[30px] px-3 text-[12px]',
}

/**
 * 🔴 **`+` 아이콘은 화소에 맞춰 그린다**(사용자 지적 2026-11-20 — 흐릿했다). 가로 · 세로 선뿐인 아이콘이라
 * 선의 가운데가 화소 경계에 걸리면(14px 아이콘 · 30px 버튼) 1.2px 선이 두 화소에 반씩 번진다. `crispEdges` 는 선을
 * 화소에 붙여 또렷한 2px 로 그린다. 🔴 다른 아이콘에는 쓰지 않는다 — 비스듬한 선 · 곡선이 계단처럼 깨진다.
 */
const iconRendering = (icon: LucideIcon) => (icon === PlusIcon ? ('crispEdges' as const) : undefined)

const AppButton = ({
  variant = 'default',
  size = 'fit',
  icon: Icon,
  iconPosition = 'left',
  iconSize = 14,
  iconStrokeWidth = 2,
  children,
  className,
  ...props
}: AppButtonProps) => {
  return (
    <button
      className={cn(
        'shrink-0 flex items-center justify-center gap-1.5 rounded-[7px] font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon size={iconSize} strokeWidth={iconStrokeWidth} shapeRendering={iconRendering(Icon)} />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon size={iconSize} strokeWidth={iconStrokeWidth} shapeRendering={iconRendering(Icon)} />
      )}
    </button>
  )
}

export default AppButton
