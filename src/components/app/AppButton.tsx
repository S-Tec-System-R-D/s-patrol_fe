import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

/**
 * 본 프로젝트 표준 버튼 (design-system.md D1).
 * - variant: default / sub / destructive / dash
 * - size: full / fit
 * - icon + iconPosition 내장
 */

type AppButtonVariant = 'default' | 'sub' | 'destructive' | 'dash'
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
  default: 'bg-primary text-primary-foreground py-2 px-4 hover:bg-primary/90',
  sub: 'bg-transparent text-foreground border border-border hover:bg-muted',
  destructive: 'bg-transparent text-destructive border border-danger/40 hover:bg-danger/10',
  dash: 'bg-none border-1 border-dashed text-muted-foreground hover:border-point hover:bg-point-bg hover:text-point',
}

const sizeStyles: Record<AppButtonSize, string> = {
  full: 'w-full',
  fit: 'w-fit',
}

const AppButton = ({
  variant = 'default',
  size = 'fit',
  icon: Icon,
  iconPosition = 'left',
  iconSize = 16,
  iconStrokeWidth = 1.5,
  children,
  className,
  ...props
}: AppButtonProps) => {
  return (
    <button
      className={cn(
        'shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={iconSize} strokeWidth={iconStrokeWidth} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={iconSize} strokeWidth={iconStrokeWidth} />}
    </button>
  )
}

export default AppButton
