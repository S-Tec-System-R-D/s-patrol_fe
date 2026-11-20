import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppKpiCard from '../AppKpiCard'

/**
 * 요약 칸 (`spec 031` T457 · 2026-11-06 코스 상세 모양 하나로 줄임).
 *
 * 🔴 **여기서 고정하는 것은 "없는 것을 그리지 않는다" 는 규칙이다.**
 */

describe('AppKpiCard', () => {
  it('값만 주면 단위가 없다', () => {
    render(<AppKpiCard label="평균 소요시간" value="50분" />)

    expect(screen.getByText('평균 소요시간')).toBeInTheDocument()
    expect(screen.getByText('50분')).toBeInTheDocument()
  })

  it('단위와 오른쪽 그림을 주면 함께 그린다', () => {
    render(
      <AppKpiCard
        label="평균 소요시간"
        value="50분"
        unit="초과 1/7"
        aside={<svg data-testid="chart" />}
      />
    )

    expect(screen.getByText('초과 1/7')).toBeInTheDocument()
    expect(screen.getByTestId('chart')).toBeInTheDocument()
  })

  it('🔴 그림이 없으면 빈 자리를 두지 않는다', () => {
    const { container } = render(
      <AppKpiCard label="마지막 순찰" value="-" aside={false} />
    )

    expect(container.querySelector('div.shrink-0')).toBeNull()
  })

  it('foot 은 스크린리더 글자로만 남는다', () => {
    render(
      <AppKpiCard
        label="평균 소요시간"
        value="50분"
        foot={{ left: '최단 42분', right: '최장 58분' }}
      />
    )

    expect(screen.getByText('최단 42분 · 최장 58분').className).toContain('sr-only')
  })

  it('🔴 라벨에는 **색을 입히지 않는다** — 굵기와 명도로 세운다', () => {
    render(<AppKpiCard label="지점 인증률" value="62%" />)

    const label = screen.getByText('지점 인증률')
    expect(label.className).toContain('font-medium')
    expect(label.className).not.toMatch(/text-(point|success|warning|danger)/)
  })
})
