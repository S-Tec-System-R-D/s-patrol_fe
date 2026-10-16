import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CoursePatrolLog from '../CoursePatrolLog'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 최근 순찰 기록 (`spec 023` 코스 상세 B단).
 *
 * 🔴🔴 **여기서 고정하는 것은 목업에 없던 실측 예외 세 가지다**(2026-10-12). 목업은 전부
 * "완료 · 3/3 · 44분" 이라, 그림대로 만들면 아래 행들에서 화면이 거짓을 말하거나 깨진다.
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

describe('CoursePatrolLog — 기본', () => {
  it('행을 표로 그린다 — 시작·근무자·인증·소요·상태', () => {
    render(<CoursePatrolLog rows={[row()]} totalCount={1} />)

    expect(screen.getByText('10.11 02:40')).toBeInTheDocument()
    expect(screen.getByText('박성민')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(screen.getByText('44분')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('최근 30일 건수를 적는다', () => {
    render(<CoursePatrolLog rows={[row()]} totalCount={46} />)

    expect(screen.getByText(/최근 30일 · 46건/)).toBeInTheDocument()
  })
})

describe('CoursePatrolLog — 🔴 실측 예외', () => {
  it('🔴 근무자가 없는 이력이 실존한다 — 아바타·이름을 항상 그릴 수 없다', () => {
    render(<CoursePatrolLog rows={[row({ userList: [] })]} totalCount={1} />)

    // 이름 자리가 비는 것이 정상이다. 깨지거나 "undefined" 가 나오면 안 된다
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('🔴 "완료" 인데 인증 0/3 인 행을 그대로 보여준다 — 상태와 인증은 독립이다', () => {
    // 실측(사업장 10): status 1(완료) + checkedCount 0. "완료 = 3/3" 으로 묶으면
    // 화면이 **없는 보장**을 약속한다
    render(<CoursePatrolLog rows={[row({ status: 1, statusName: '완료', checkedCount: 0 })]} totalCount={1} />)

    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('0/3')).toBeInTheDocument()
  })

  it('🔴 소요시간에 시 단위가 온다 — 분으로 읽으면 2분이 된다', () => {
    render(<CoursePatrolLog rows={[row({ actualElapsedTime: '02:17:40' })]} totalCount={1} />)

    expect(screen.getByText('2시간 18분')).toBeInTheDocument()
    expect(screen.queryByText('2분')).not.toBeInTheDocument()
  })

  it('초과 이력은 별도 뱃지다 — 상태 뱃지를 덮어쓰지 않는다', () => {
    render(<CoursePatrolLog rows={[row({ overtimeYn: true })]} totalCount={1} />)

    expect(screen.getByText('완료')).toBeInTheDocument()
    expect(screen.getByText('초과')).toBeInTheDocument()
  })

  it('진행 중(endDt: null)도 그린다 — eventType=0 이 거르는 상태다', () => {
    render(
      <CoursePatrolLog
        rows={[row({ status: 0, statusName: '진행중', endDt: null, checkedCount: 1 })]}
        totalCount={1}
      />
    )

    expect(screen.getByText('진행중')).toBeInTheDocument()
  })

  it('🔴 statusName 이 비면 코스 사전으로 메운다 — 빈 뱃지를 그리지 않는다', () => {
    render(<CoursePatrolLog rows={[row({ status: 2, statusName: '  ' })]} totalCount={1} />)

    expect(screen.getByText('미완료')).toBeInTheDocument()
  })
})

describe('CoursePatrolLog — 상태 구분', () => {
  it('🔴 조회 중에는 빈 상태가 아니라 스켈레톤이다 — 빈 상태는 "순찰 안 했다" 로 읽힌다', () => {
    render(<CoursePatrolLog rows={[]} totalCount={0} isPending />)

    expect(screen.queryByText('순찰 기록이 없습니다')).not.toBeInTheDocument()
  })

  it('이력이 없으면 빈 상태다 — "준비 중" 이 아니다', () => {
    render(<CoursePatrolLog rows={[]} totalCount={0} />)

    expect(screen.getByText('순찰 기록이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument()
  })
})

describe('CoursePatrolLog — 🔴 수치의 출처를 밝힌다', () => {
  it('🔴 "화면에서 계산한 값" 이라고 적는다 — 서버 집계가 아니다', () => {
    render(<CoursePatrolLog rows={[row()]} totalCount={1} />)

    expect(screen.getByText(/화면에서 계산한 값/)).toBeInTheDocument()
  })

  it('🔴 한 페이지로 다 못 받으면 **몇 건 기준**인지 적는다', () => {
    render(<CoursePatrolLog rows={[row()]} totalCount={46} />)

    expect(screen.getByText(/최근 1건 기준/)).toBeInTheDocument()
  })

  it('🔴 비고 칸을 만들지 않았다 — 미인증 지점명은 행에 없다(N+1 회피, 사용자 결정)', () => {
    render(<CoursePatrolLog rows={[row()]} totalCount={1} />)

    expect(screen.queryByText('비고')).not.toBeInTheDocument()
  })
})
