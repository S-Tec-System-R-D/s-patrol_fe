import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CourseKpiRow from '../CourseKpiRow'
import type { CourseHistoryStats } from '@/features/course-history/lib/courseHistoryStats'

/**
 * KPI 3종 (`spec 023` 코스 상세 B단).
 *
 * 🔴🔴 **가장 중요한 단정은 "인증률 미달을 경고로 바꾸지 않는다" 다.** 지점 상태에
 * **`순찰제외`(2)** 가 있고(백엔드 전달 2026-10-12) `pointCount` 가 그것을 빼고 센 값인지
 * **미확인**이다. 순찰에서 빼기로 한 지점이 분모에 있으면 영원히 100% 가 안 되는 코스가
 * 생기고, 그걸 빨갛게 칠하면 관리자는 매번 **없는 문제**를 찾는다.
 */

const stats = (overrides: Partial<CourseHistoryStats> = {}): CourseHistoryStats => ({
  runCount: 60,
  avgElapsedSec: 47 * 60,
  checkedSum: 174,
  pointSum: 180,
  authRate: 174 / 180,
  sampledCount: 60,
  // `spec 031` 확장 — 구성 바에 쓰는 값
  statusCounts: { done: 55, inProgress: 2, failed: 3 },
  minElapsedSec: 42 * 60,
  maxElapsedSec: 58 * 60,
  partial: false,
  lastRunDt: '2026-11-06T09:10:00',
  overtimeCount: 1,
  recentRuns: [
    {
      startDt: '2026-11-05T09:10:00',
      elapsedSec: 3000,
      overtime: true,
      checkedCount: 1,
      pointCount: 3,
    },
    {
      startDt: '2026-11-06T09:10:00',
      elapsedSec: 2400,
      overtime: false,
      checkedCount: 3,
      pointCount: 3,
    },
  ],
  ...overrides,
})

describe('CourseKpiRow — 값', () => {
  it('마지막 순찰·평균 소요·초과·인증률을 적는다', () => {
    render(<CourseKpiRow stats={stats()} />)

    expect(screen.getByText('마지막 순찰')).toBeInTheDocument()
    expect(screen.getByText('11.06 09:10')).toBeInTheDocument()
    expect(screen.getByText('47분')).toBeInTheDocument()
    expect(screen.getByText('초과 1/60')).toBeInTheDocument()
    expect(screen.getByText('96.7%')).toBeInTheDocument()
    expect(screen.getByText('174/180')).toBeInTheDocument()
  })

  it('회차가 7개보다 적어도 소요시간 막대는 7칸이다', () => {
    render(<CourseKpiRow stats={stats()} />)

    expect(screen.getByRole('img', { name: '최근 2회 소요시간' }).children).toHaveLength(7)
  })

  it('인증률 선 그래프는 분모가 0 인 회차를 찍지 않는다', () => {
    const recentRuns = [
      { startDt: '2026-11-05T09:10:00', elapsedSec: 3000, overtime: false, checkedCount: 0, pointCount: 0 },
      { startDt: '2026-11-06T09:10:00', elapsedSec: 2400, overtime: false, checkedCount: 3, pointCount: 3 },
    ]
    render(<CourseKpiRow stats={stats({ recentRuns })} />)

    expect(screen.getByRole('img', { name: '최근 2회 인증률' }).querySelectorAll('circle')).toHaveLength(1)
  })

  it('마지막 순찰이 얼마 전인지 적는다', () => {
    render(<CourseKpiRow stats={stats({ lastRunDt: '2020-01-01T09:00:00' })} />)

    expect(screen.getByText(/^\d+일 전$/)).toBeInTheDocument()
  })

  it('🔴 유난히 긴 회차가 있어도 나머지 막대가 바닥에 붙지 않는다', () => {
    const run = (elapsedSec: number) => ({
      startDt: `2026-11-0${elapsedSec % 9 || 1}T09:00:00`,
      elapsedSec,
      overtime: false,
      checkedCount: 3,
      pointCount: 3,
    })
    render(<CourseKpiRow stats={stats({ recentRuns: [run(1000), run(1000), run(1000), run(9000)] })} />)

    const filled = screen
      .getByRole('img', { name: '최근 4회 소요시간' })
      .querySelectorAll<HTMLElement>('.bg-point')
    expect(filled[0].style.height).toBe('50%')
    expect(filled[3].style.height).toBe('100%')
  })

  it('기준을 넘긴 회차만 주황이다', () => {
    render(<CourseKpiRow stats={stats()} />)

    const bars = screen.getByRole('img', { name: '최근 2회 소요시간' })
    expect(bars.querySelectorAll('.bg-warning')).toHaveLength(1)
    expect(bars.querySelectorAll('.bg-point')).toHaveLength(1)
  })

  it('🔴 시 단위 평균도 맞게 적는다', () => {
    render(<CourseKpiRow stats={stats({ avgElapsedSec: 2 * 3600 + 18 * 60 })} />)

    expect(screen.getByText('2시간 18분')).toBeInTheDocument()
  })
})

describe('CourseKpiRow — 🔴 빈 상태를 0 으로 적지 않는다', () => {
  it('🔴 이력이 없으면 평균·인증률이 — 다 — 0분·0% 는 "순찰했는데 결과가 0" 으로 읽힌다', () => {
    render(
      <CourseKpiRow
        stats={stats({ runCount: 0, sampledCount: 0, avgElapsedSec: null, authRate: null, pointSum: 0, checkedSum: 0, lastRunDt: null, recentRuns: [] })}
      />
    )

    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(3)
    expect(screen.queryByText(/초과/)).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByText('0분')).not.toBeInTheDocument()
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument()
  })
})

describe('CourseKpiRow — 🔴 순찰제외 때문에 인증률에 색을 입히지 않는다', () => {
  it('🔴 인증률이 낮아도 경고색으로 바뀌지 않는다 — 분모가 맞는지 모른다', () => {
    const { container } = render(<CourseKpiRow stats={stats({ authRate: 0.4 })} />)

    expect(screen.getByText('40.0%')).toBeInTheDocument()
    // danger 톤이 어디에도 쓰이지 않는다
    expect(container.querySelector('.bg-danger-bg')).toBeNull()
    // 회차 인증률이 달라도 그래프 색은 하나다
    expect(screen.getByRole('img', { name: '최근 2회 인증률' })).toHaveClass('text-chart-2')
  })
})
