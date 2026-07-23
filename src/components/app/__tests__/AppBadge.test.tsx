import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppBadge from '@/components/app/AppBadge'

describe('AppBadge', () => {
  it.each([
    ['success', 'bg-success-bg', 'text-success-foreground'],
    ['point', 'bg-point-bg', 'text-point-foreground'],
    ['warning', 'bg-warning-bg', 'text-warning-foreground'],
    ['danger', 'bg-danger-bg', 'text-danger-foreground'],
    ['muted', 'bg-muted', 'text-muted-foreground'],
  ] as const)('variant=%s → %s + %s 클래스 적용', (variant, bg, fg) => {
    render(<AppBadge variant={variant}>완료</AppBadge>)
    const badge = screen.getByText('완료')
    expect(badge).toHaveClass(bg)
    expect(badge).toHaveClass(fg)
  })
})
