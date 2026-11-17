import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import CoursePatrolLog from '../CoursePatrolLog'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 최근 순찰 기록 (`spec 023` 코스 상세 B단 → `spec 074` 개편).
 *
 * 🔴🔴 **목업에 없던 실측 예외 세 가지를 고정한다**(2026-10-12) — 근무자 없는 이력 · `완료` 인데 `0/3` ·
 * 소요시간 시 단위. 074 에서 더한 것: 10건 · 누락 열 · 초과는 상태 옆 · 행 클릭 · 전체 보기 링크.
 */

const row = (overrides: Partial<CourseHistoryRow> = {}): CourseHistoryRow => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  startDt: '2026-10-11T02:40:00',
  endDt: '2026-10-11T03:24:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 3,
  checkedCount: 3,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:44:00',
  hasMemo: false,
  userList: [{ userSeq: 21, userName: '박성민' }],
  ...overrides,
})

const renderLog = (
  rows: CourseHistoryRow[],
  totalCount = rows.length,
  extra: { isPending?: boolean; onSelect?: (row: CourseHistoryRow) => void } = {}
) =>
  render(
    <MemoryRouter>
      <CoursePatrolLog
        courseSeq={1}
        rows={rows}
        totalCount={totalCount}
        isPending={extra.isPending}
        onSelect={extra.onSelect ?? (() => {})}
      />
    </MemoryRouter>
  )

const dataRows = () => screen.getAllByRole('row', { name: /회차 상세/ })

describe('CoursePatrolLog — 기본', () => {
  it('행을 표로 그린다 — 시작·근무자·인증·소요·상태 (D11 누락 칸 삭제)', () => {
    renderLog([row()])

    expect(screen.getByText('10.11 02:40')).toBeInTheDocument()
    expect(screen.getByText('박성민')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(screen.getByText('44분')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      '시작',
      '근무자',
      '인증',
      '소요',
      '상태',
    ])
  })

  it('최근 30일 건수를 적는다', () => {
    renderLog([row()], 46)

    expect(screen.getByText(/최근 30일 · 46건/)).toBeInTheDocument()
  })

  it('🔴 앞 10건만 그리고 나머지는 순찰이력 화면 — 코스 필터로 넘긴다', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row({ historySeq: i + 1 }))
    renderLog(rows, 28)

    expect(dataRows()).toHaveLength(10)
    expect(screen.getByRole('link', { name: /전체 기록 28건 보기/ })).toHaveAttribute('href', '/patrol/zones?course=1')
  })

  it('다 보이면 전체 보기 링크가 없다', () => {
    renderLog([row()])

    expect(screen.queryByRole('link', { name: /전체 기록/ })).toBeNull()
  })

  it('🔴 행을 누르면 그 회차를 올려 보낸다 — Enter 도 같다', async () => {
    const onSelect = vi.fn()
    renderLog([row({ historySeq: 7 })], 1, { onSelect })

    await userEvent.click(dataRows()[0])
    dataRows()[0].focus()
    await userEvent.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect.mock.calls[0][0].historySeq).toBe(7)
  })
})

describe('CoursePatrolLog — 🔴 회차 상태 (spec 079 D13)', () => {
  it('서버 미완료(2)는 미완료 — 회차 자체의 상태(도중 종료)다 · 지점 미인증은 줄에 적지 않는다', () => {
    renderLog([row({ historySeq: 1, checkedCount: 1, status: 2, statusName: '미완료' })])

    expect(screen.getByText('미완료')).toBeInTheDocument()
    expect(screen.getByText('1/3')).toBeInTheDocument()
    expect(screen.queryByText('완료')).not.toBeInTheDocument()
    expect(screen.queryByText(/누락|미인증/)).not.toBeInTheDocument()
  })
})

describe('CoursePatrolLog — 🔴 실측 예외', () => {
  it('🔴 근무자가 없는 이력이 실존한다 — `근무자 없음`', () => {
    renderLog([row({ userList: [] })])

    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    expect(screen.getByText('근무자 없음')).toBeInTheDocument()
  })

  it('🔴 "완료" 인데 인증 0/3 인 행을 그대로 보여준다 — 상태와 인증은 독립이다', () => {
    renderLog([row({ status: 1, statusName: '완료', checkedCount: 0 })])

    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
  })

  it('🔴 소요시간에 시 단위가 온다 — 분으로 읽으면 2분이 된다', () => {
    renderLog([row({ actualElapsedTime: '02:17:40' })])

    expect(screen.getByText('2시간 18분')).toBeInTheDocument()
    expect(screen.queryByText('2분')).not.toBeInTheDocument()
  })

  it('시간초과는 상태 옆 빨강 뱃지다 — 상태 뱃지를 덮어쓰지 않는다 · 기준 초과 열은 없다', () => {
    renderLog([row({ overtimeYn: true })])

    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('시간초과')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: '기준 초과' })).toBeNull()
  })

  it('진행 중(endDt: null)도 그린다', () => {
    renderLog([row({ status: 0, statusName: '진행중', endDt: null, checkedCount: 1 })])

    expect(screen.getByText('진행중')).toBeInTheDocument()
  })

  it('🔴 statusName 이 비어도 공통 규칙으로 그린다 — 빈 뱃지를 그리지 않는다', () => {
    renderLog([row({ status: 2, statusName: '  ' })])

    expect(screen.getByText('미완료')).toBeInTheDocument()
  })
})

describe('CoursePatrolLog — 상태 구분', () => {
  it('🔴 조회 중에는 빈 상태가 아니라 스켈레톤이다 — 빈 상태는 "순찰 안 했다" 로 읽힌다', () => {
    renderLog([], 0, { isPending: true })

    expect(screen.queryByText('순찰 기록이 없습니다')).not.toBeInTheDocument()
  })

  it('이력이 없으면 빈 상태다 — "준비 중" 이 아니다', () => {
    renderLog([], 0)

    expect(screen.getByText('순찰 기록이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument()
  })

  it('🔴 한 페이지로 다 못 받으면 **몇 건 기준**인지 적는다(서버 집계 없음)', () => {
    renderLog([row()], 146)

    expect(screen.getByText(/최근 1건 기준/)).toBeInTheDocument()
  })
})
