import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CourseKpiRow from '../CourseKpiRow'
import type { CourseHistoryStats } from '@/features/course-history/lib/courseHistoryStats'

/**
 * KPI 4종 (`spec 023` 코스 상세 B단).
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
  ...overrides,
})

describe('CourseKpiRow — 값', () => {
  it('30일 수행 횟수·평균 소요·인증률을 적는다', () => {
    render(<CourseKpiRow stats={stats()} uncheckedCount={7} />)

    expect(screen.getByText('30일 순찰 수행')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('47분')).toBeInTheDocument()
    expect(screen.getByText('96.7%')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
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
        stats={stats({ runCount: 0, avgElapsedSec: null, authRate: null, pointSum: 0, checkedSum: 0 })}
      />
    )

    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('0분')).not.toBeInTheDocument()
    expect(screen.queryByText('0.0%')).not.toBeInTheDocument()
  })

  it('🔴 미인증 건수를 아직 못 받았으면 — 다. 0건으로 단정하지 않는다', () => {
    render(<CourseKpiRow stats={stats()} uncheckedCount={undefined} />)

    expect(screen.getByText('미인증 지점')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})

describe('CourseKpiRow — 🔴 순찰제외 때문에 인증률에 색을 입히지 않는다', () => {
  it('🔴 인증률이 낮아도 경고색으로 바뀌지 않는다 — 분모가 맞는지 모른다', () => {
    const { container } = render(<CourseKpiRow stats={stats({ authRate: 0.4 })} />)

    expect(screen.getByText('40.0%')).toBeInTheDocument()
    // danger 톤이 어디에도 쓰이지 않는다
    expect(container.querySelector('.bg-danger-bg')).toBeNull()
  })

  it('미인증 건수는 경고색을 쓴다 — 그건 서버가 직접 센 값이다', () => {
    const { container } = render(<CourseKpiRow stats={stats()} uncheckedCount={7} />)

    expect(container.querySelector('.bg-warning-bg')).not.toBeNull()
  })

  it('미인증이 0건이면 경고색을 쓰지 않는다', () => {
    const { container } = render(<CourseKpiRow stats={stats()} uncheckedCount={0} />)

    expect(container.querySelector('.bg-warning-bg')).toBeNull()
  })
})
