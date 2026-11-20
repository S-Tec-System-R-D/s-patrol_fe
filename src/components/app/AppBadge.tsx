import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes, ReactNode } from 'react'
import {
  CircleCheckIcon,
  CircleMinusIcon,
  CirclePauseIcon,
  ClockIcon,
  LoaderCircleIcon,
  type LucideIcon,
} from 'lucide-react'
import { badgeIconClass, badgeVariants } from './AppBadge.variants'

interface AppBadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode
  /**
   * 종류의 기본 아이콘과 뜻이 다를 때만 넘긴다(예: `success` 인데 체크가 아니라 `근무 중` 의 점 원).
   * `false` 면 아이콘 없이 글자만.
   */
  icon?: LucideIcon | false
}

/**
 * 종류의 **기본 아이콘** — 그 종류에서 가장 흔한 뜻에 맞췄다(`spec 083`).
 * 완료 · 인증 · 사용 = 체크 / 진행 = 고리 / 시간초과 = 시계 / 미완료 · 미인증 · 미사용 = 빼기 원 / 대기 = 멈춤 원.
 * `warning` · `plain` · `chip` 은 아이콘이 없다.
 */
const DEFAULT_ICON: Record<string, LucideIcon> = {
  success: CircleCheckIcon,
  point: LoaderCircleIcon,
  danger: ClockIcon,
  muted: CircleMinusIcon,
  neutral: CircleMinusIcon,
  pending: CirclePauseIcon,
}

/**
 * 상태 표시 표준 — **아이콘 + 글자**(`spec 083` — 전에는 색 바탕 알약이었다).
 * 색만으로 상태를 전달하지 않는다 — 아이콘 모양이 종류마다 다르고 children 텍스트를 항상 요구한다.
 * 아이콘은 장식이라 `aria-hidden` 이다(뜻은 글자가 말한다).
 */
const AppBadge = ({ variant, icon, className, children, ...props }: AppBadgeProps) => {
  const kind = variant ?? 'muted'
  const Icon = icon === false ? null : (icon ?? DEFAULT_ICON[kind])

  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {Icon && <Icon size={13} strokeWidth={2.2} className={cn('shrink-0', badgeIconClass[kind])} aria-hidden />}
      {children}
    </span>
  )
}

export default AppBadge
