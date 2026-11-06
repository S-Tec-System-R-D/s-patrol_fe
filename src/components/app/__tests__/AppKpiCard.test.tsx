import { render, screen } from '@testing-library/react'
import { ActivityIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import AppKpiCard from '../AppKpiCard'

/**
 * 요약 칸 (`spec 031` T457 · 2026-11-06 두 모양으로 줄임).
 *
 * 🔴 **여기서 고정하는 것은 "없는 것을 그리지 않는다" 와 "색은 근거가 있는 칸에만" 이다.**
 */

describe('AppKpiCard — 한 줄 카드(기본)', () => {
  it('값만 주면 단위·보조 문구가 없다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="배치 나간 인원" value={7} />)

    expect(screen.getByText('배치 나간 인원')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.queryByText('명')).not.toBeInTheDocument()
  })

  it('단위·보조 문구를 주면 함께 그린다 — 잘려도 title 에 남는다', () => {
    render(
      <AppKpiCard icon={ActivityIcon} label="배치 나간 인원" value={7} unit="명" hint="배치예정 포함" />
    )

    expect(screen.getByText('명')).toBeInTheDocument()
    expect(screen.getByText('배치예정 포함')).toHaveAttribute('title', '배치예정 포함')
  })

  it('🔴 기본 톤은 중립이다 — 칸마다 색을 바꾸면 칸끼리 경쟁한다', () => {
    const { container } = render(<AppKpiCard icon={ActivityIcon} label="배치 온 인원" value={1} />)

    const chip = container.querySelector('.size-8')
    expect(chip?.className).toContain('bg-muted')
    expect(chip?.className).not.toContain('bg-warning-bg')
  })

  it('warning 톤은 아이콘 칩에만 걸린다', () => {
    const { container } = render(
      <AppKpiCard icon={ActivityIcon} label="대기중인 배치요청" value={8} unit="건" tone="warning" />
    )

    expect(container.querySelector('.size-8')?.className).toContain('bg-warning-bg')
    expect(screen.getByText('8').className).not.toContain('warning')
  })

  it('🔴 라벨에는 **색을 입히지 않는다** — 굵기와 명도로 세운다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="배치 온 인원" value={7} tone="warning" />)

    const label = screen.getByText('배치 온 인원')
    expect(label.className).toContain('font-medium')
    expect(label.className).not.toMatch(/text-(point|success|warning|danger)/)
  })
})

describe('AppKpiCard — 가로 얇은 카드(compact)', () => {
  it('오른쪽 그림을 그리고 아이콘 칩은 없다', () => {
    const { container } = render(
      <AppKpiCard
        compact
        icon={ActivityIcon}
        label="평균 소요시간"
        value="50분"
        aside={<svg data-testid="chart" />}
      />
    )

    expect(screen.getByTestId('chart')).toBeInTheDocument()
    expect(container.querySelector('.size-8')).toBeNull()
  })

  it('🔴 그림이 없으면 빈 자리를 두지 않는다', () => {
    const { container } = render(
      <AppKpiCard compact icon={ActivityIcon} label="마지막 순찰" value="-" aside={false} />
    )

    expect(container.querySelector('div.shrink-0')).toBeNull()
  })

  it('foot 은 스크린리더 글자로만 남는다', () => {
    render(
      <AppKpiCard
        compact
        icon={ActivityIcon}
        label="평균 소요시간"
        value="50분"
        foot={{ left: '최단 42분', right: '최장 58분' }}
      />
    )

    expect(screen.getByText('최단 42분 · 최장 58분').className).toContain('sr-only')
  })
})
