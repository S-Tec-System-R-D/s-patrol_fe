import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CircleDotIcon } from 'lucide-react'
import AppBadge from '@/components/app/AppBadge'

/** 상태 표시 = 아이콘 + 글자(`spec 083`). 색은 아이콘에만 준다 — 빨강만 글자도 빨강 */
describe('AppBadge', () => {
  it.each([
    ['success', 'lucide-circle-check', 'text-success'],
    ['point', 'lucide-loader-circle', 'text-point'],
    ['danger', 'lucide-clock', 'text-danger'],
    ['muted', 'lucide-circle-minus', 'text-muted-foreground'],
    ['neutral', 'lucide-circle-minus', 'text-muted-foreground'],
    ['pending', 'lucide-circle-pause', 'text-muted-foreground'],
  ] as const)('variant=%s → 아이콘 %s · 아이콘 색 %s', (variant, iconClass, color) => {
    render(<AppBadge variant={variant}>상태</AppBadge>)
    const icon = screen.getByText('상태').querySelector('svg')
    expect(icon).toHaveClass(iconClass, color)
    // 아이콘은 장식이다 — 뜻은 글자가 말한다
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('🔴 색 바탕 알약이 아니다 — 글자는 본문색이고 빨강만 글자도 빨강', () => {
    render(
      <>
        <AppBadge variant="success">완료</AppBadge>
        <AppBadge variant="danger">시간초과</AppBadge>
      </>
    )
    expect(screen.getByText('완료')).toHaveClass('text-foreground')
    expect(screen.getByText('완료').className).not.toMatch(/bg-/)
    expect(screen.getByText('시간초과')).toHaveClass('text-danger')
  })

  it.each(['warning', 'plain', 'chip'] as const)('variant=%s 는 아이콘이 없다', (variant) => {
    render(<AppBadge variant={variant}>값</AppBadge>)
    expect(screen.getByText('값').querySelector('svg')).toBeNull()
  })

  it('분류 값 — plain 은 글자만 · chip 은 옅은 회색 칩', () => {
    render(
      <>
        <AppBadge variant="plain">근무자</AppBadge>
        <AppBadge variant="chip">관리자</AppBadge>
      </>
    )
    expect(screen.getByText('근무자').className).not.toMatch(/bg-/)
    expect(screen.getByText('관리자')).toHaveClass('bg-muted')
  })

  it('icon 을 넘기면 기본 아이콘 대신 그것을 그린다 — 색은 종류를 따른다', () => {
    render(
      <AppBadge variant="success" icon={CircleDotIcon}>
        근무 중
      </AppBadge>
    )
    const icon = screen.getByText('근무 중').querySelector('svg')
    expect(icon).toHaveClass('lucide-circle-dot', 'text-success')
  })

  it('icon={false} 면 종류가 무엇이든 글자만', () => {
    render(
      <AppBadge variant="danger" icon={false}>
        시간초과 +3분
      </AppBadge>
    )
    expect(screen.getByText('시간초과 +3분').querySelector('svg')).toBeNull()
  })
})
