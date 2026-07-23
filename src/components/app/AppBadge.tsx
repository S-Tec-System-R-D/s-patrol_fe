import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes, ReactNode } from 'react'
import { badgeVariants } from './AppBadge.variants'

interface AppBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode
}

/**
 * 상태/결과 뱃지 표준 (design-system.md §1-1 시맨틱 5색).
 * 색만으로 상태를 전달하지 않도록 children 텍스트를 항상 요구한다.
 */
const AppBadge = ({ variant, className, children, ...props }: AppBadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  )
}

export default AppBadge
