import { render, screen } from '@testing-library/react'
import { ActivityIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import AppKpiCard from '../AppKpiCard'

/**
 * 요약 칸 (`spec 031` T457).
 *
 * 🔴 **여기서 고정하는 것은 "없는 것을 그리지 않는다" 는 규칙이다.** 바·단위·보조 줄은
 * 전부 **선택**이고, 특히 **`0%` 바를 그리면 "0점" 으로 읽힌다** — 비율을 만들 수 없는
 * 상태(분모 0·이력 없음)와 진짜 0% 는 다른 사실이다.
 */

const bar = () => document.querySelector('[role="presentation"]')

describe('AppKpiCard — 선택 요소', () => {
  it('값만 주면 단위·바·보조 줄이 없다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="30일 순찰 수행" value={7} />)

    expect(screen.getByText('30일 순찰 수행')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(bar()).toBeNull()
  })

  it('단위·보조 줄을 주면 함께 그린다', () => {
    render(
      <AppKpiCard
        icon={ActivityIcon}
        label="2주 인증"
        value={7}
        unit="회"
        hint="최근 14일 기준"
      />
    )

    expect(screen.getByText('회')).toBeInTheDocument()
    expect(screen.getByText('최근 14일 기준')).toBeInTheDocument()
  })
})

describe('AppKpiCard — 바', () => {
  it('ratio 를 주면 바를 그리고 너비가 비율을 따른다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="지점 인증률" value="61.9%" ratio={0.619} />)

    const track = bar()
    expect(track).not.toBeNull()
    expect((track?.firstElementChild as HTMLElement).style.width).toBe('61.9%')
  })

  it('🔴 ratio 가 null 이면 바가 없다 — 0% 바는 "0점" 으로 읽힌다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="지점 인증률" value="—" ratio={null} />)

    expect(bar()).toBeNull()
  })

  it('🔴 바는 **중립색**이다 — 인증률에 색을 못 쓰는 이유가 바에도 적용된다 (spec 023)', () => {
    render(<AppKpiCard icon={ActivityIcon} label="지점 인증률" value="61.9%" ratio={0.619} />)

    const fill = bar()?.firstElementChild as HTMLElement
    expect(fill.className).toContain('bg-muted-foreground/40')
    expect(fill.className).not.toMatch(/bg-(danger|warning|success|point)/)
  })

  it('범위를 벗어난 비율은 0~100% 로 자른다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="과속" value="150%" ratio={1.5} />)

    expect((bar()?.firstElementChild as HTMLElement).style.width).toBe('100%')
  })
})

describe('AppKpiCard — 톤과 값 크기', () => {
  it('🔴 기본 톤은 중립이다 — 색은 근거 있는 칸에만 준다', () => {
    const { container } = render(<AppKpiCard icon={ActivityIcon} label="소속 코스" value={1} />)

    const chip = container.querySelector('.size-8')
    expect(chip?.className).toContain('bg-muted')
    expect(chip?.className).not.toMatch(/bg-(warning|danger)-bg/)
  })

  it('warning 톤은 아이콘 칩에만 걸린다', () => {
    const { container } = render(
      <AppKpiCard icon={ActivityIcon} label="미인증 지점" value={8} unit="건" tone="warning" />
    )

    expect(container.querySelector('.size-8')?.className).toContain('bg-warning-bg')
  })

  it('🔴 숫자가 아닌 값은 한 단계 작게 — 날짜가 숫자 자리에 오면 줄바꿈된다', () => {
    render(
      <AppKpiCard icon={ActivityIcon} label="최근 순찰" value="10.13 09:07" compactValue />
    )

    expect(screen.getByText('10.13 09:07').className).toContain('text-panel-title')
    expect(screen.getByText('10.13 09:07').className).not.toContain('text-xl')
  })
})
