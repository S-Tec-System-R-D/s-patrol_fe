import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppTable from '@/components/AppTable'
import type { PointHistoryRow } from '@/features/course-history/types'
import { pointHistoryColumns } from '../PointColumn'

/**
 * 지점 순찰이력 목록 컬럼 (`spec 037` T541).
 *
 * 🔴 **mock 기반 테스트를 걷어냈다.** 이전 판은 `PointPatrolType`(`Date` + 로컬 enum)과
 * **기록 모달 버튼**을 검증했다 — 둘 다 서버 전환으로 사라진 것이다(상세가 페이지가 됐다).
 */

const row = (over: Partial<PointHistoryRow> = {}): PointHistoryRow => ({
  detailSeq: 418,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  pointSeq: 12,
  pointName: '정문 입구',
  checkDt: '2026-05-01T09:07:00',
  userSeq: 21,
  userName: '김근무',
  authMethod: 9,
  authMethodName: 'QR',
  status: 4,
  statusName: '완료',
  overTimeYn: false,
  hasMemo: false,
  pauseTime: '00:07:00',
  ...over,
})

const renderRows = (rows: PointHistoryRow[]) =>
  render(<AppTable columns={pointHistoryColumns()} data={rows} />)

describe('pointHistoryColumns', () => {
  it('날짜와 시각을 두 줄로 나눠 적는다', () => {
    renderRows([row()])

    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
    expect(screen.getByText('09:07')).toBeInTheDocument()
  })

  it('완료 + 메모 없음 → 이상없음', () => {
    renderRows([row()])

    expect(screen.getByText('이상없음')).toBeInTheDocument()
  })

  it('🔴 완료 + 메모 있음 → 순찰기록 (서버 status 에 그 구분이 없다)', () => {
    renderRows([row({ hasMemo: true })])

    expect(screen.getByText('순찰기록')).toBeInTheDocument()
    expect(screen.getByLabelText('순찰 기록 있음')).toBeInTheDocument()
  })

  it('🔴 시간초과는 결과와 나란히 뱃지 2개로 병기한다 — 독립 축이다', () => {
    renderRows([row({ overTimeYn: true })])

    expect(screen.getByText('이상없음')).toBeInTheDocument()
    expect(screen.getByText('시간초과')).toBeInTheDocument()
  })

  it('🔴 미완료 행도 인증시각을 보여준다 (OQ-15 해소) — checkDt 는 인증 시간이다', () => {
    renderRows([row({ status: 3, statusName: '미완료', authMethod: null, authMethodName: '' })])

    expect(screen.getByText('미완료')).toBeInTheDocument()
    expect(screen.getByText('09:07')).toBeInTheDocument()
  })

  it('🔴 미완료 행의 인증수단은 빈 칸이다 — "모른다" 가 아니라 인증이 없었다', () => {
    renderRows([row({ status: 3, authMethod: null, authMethodName: '' })])

    expect(screen.queryByText('QR')).not.toBeInTheDocument()
  })

  it('🔴 기록은 건수가 아니라 아이콘이다 — 목록에 건수가 없다(N+1 회피)', () => {
    renderRows([row({ hasMemo: true })])

    expect(screen.queryByText('1건')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /건/ })).not.toBeInTheDocument()
  })

  it('🔴 정렬 화살표를 만들지 않는다 — 서버 페이징 중 클라 정렬은 현재 페이지만 섞는다', () => {
    renderRows([row()])

    expect(screen.queryByRole('button', { name: /순찰일시/ })).not.toBeInTheDocument()
  })

  it('구간은 값만 보여주고 판정하지 않는다 (OQ-037-A — pauseTime 의미 미확정)', () => {
    renderRows([row({ pauseTime: '00:07:00' })])

    expect(screen.getByText('7분')).toBeInTheDocument()
    expect(screen.queryByText(/상한/)).not.toBeInTheDocument()
  })
})
