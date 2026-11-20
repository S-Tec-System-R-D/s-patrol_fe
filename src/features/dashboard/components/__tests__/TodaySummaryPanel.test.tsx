import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { CourseHistoryRow } from '@/features/course-history/types'
import TodaySummaryPanel from '../TodaySummaryPanel'

/** 오늘 요약(대시보드 가운데 칸 — `spec 084`). 집계 자체는 `todayStats.test` 가 본다 — 여기는 그리는 규칙만 */

const TODAY = '2026-11-20'
const row = (courseSeq: number, courseName: string, time: string): CourseHistoryRow =>
  ({ courseSeq, courseName, startDt: `${TODAY}T${time}` }) as CourseHistoryRow

const COURSES = [
  { courseSeq: 1, courseName: '본관 외곽' },
  { courseSeq: 2, courseName: '지하주차장' },
  { courseSeq: 3, courseName: '별관 창고' },
]

const renderPanel = (props: Partial<React.ComponentProps<typeof TodaySummaryPanel>> = {}) =>
  render(
    <TodaySummaryPanel
      rows={[row(1, '본관 외곽', '09:00:00'), row(1, '본관 외곽', '10:00:00'), row(2, '지하주차장', '09:30:00')]}
      courses={COURSES}
      today={TODAY}
      currentHour={10}
      state="ready"
      onRetry={() => {}}
      {...props}
    />
  )

describe('TodaySummaryPanel', () => {
  it('두 영역의 제목과 오늘 시작한 회차 수를 적는다', () => {
    renderPanel()
    expect(screen.getByRole('heading', { name: '오늘 시간대별 순찰' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '오늘 코스별 순찰' })).toBeInTheDocument()
    expect(screen.getAllByText('시작 시각 기준 · 3회')).toHaveLength(2)
    expect(screen.getByRole('img', { name: '오늘 시간대별 순찰 — 모두 3회' })).toBeInTheDocument()
  })

  it('🔴 코스별 — 많은 순이고 오늘 안 돈 코스도 0회 줄로 보인다', () => {
    renderPanel()
    const items = within(screen.getByRole('list', { name: '오늘 코스별 순찰' })).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['본관 외곽2회', '지하주차장1회', '별관 창고0회'])
  })

  it('코스 목록을 못 받았으면 오늘 돈 코스만 그린다', () => {
    renderPanel({ courses: undefined })
    const items = within(screen.getByRole('list', { name: '오늘 코스별 순찰' })).getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('🔴 받은 것이 100건이면 `최근 100건 기준` 이라고 적는다 — 숫자가 실제보다 적을 수 있다', () => {
    renderPanel({ rows: Array.from({ length: 100 }, () => row(1, '본관 외곽', '09:00:00')) })
    expect(screen.getAllByText('시작 시각 기준 · 100회 · 최근 100건 기준')).toHaveLength(2)
  })

  it('오늘 시작한 순찰이 없으면 — 시간대별은 한 줄 안내, 코스별은 0회 줄', () => {
    renderPanel({ rows: [] })
    expect(screen.getByText('오늘 시작한 순찰이 없습니다')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: '오늘 코스별 순찰' })).getAllByRole('listitem')).toHaveLength(3)
  })

  it('순찰도 코스도 없으면 두 영역 모두 한 줄 안내', () => {
    renderPanel({ rows: [], courses: [] })
    expect(screen.getAllByText('오늘 시작한 순찰이 없습니다')).toHaveLength(2)
  })

  it('🔴 조회 중 · 실패를 "없음" 으로 그리지 않는다 — 실패면 다시 시도', () => {
    const onRetry = vi.fn()
    const { unmount } = renderPanel({ state: 'loading' })
    expect(screen.queryByText('오늘 시작한 순찰이 없습니다')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText('불러오는 중')).toHaveLength(2)
    unmount()

    renderPanel({ state: 'error', onRetry })
    expect(screen.getAllByText('오늘 순찰을 불러오지 못했습니다')).toHaveLength(2)
    screen.getAllByRole('button', { name: '다시 시도' })[0].click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
