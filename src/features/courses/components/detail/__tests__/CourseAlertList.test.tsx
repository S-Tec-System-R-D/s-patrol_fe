import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CourseAlertList from '../CourseAlertList'
import type { CourseAlert, CourseAlerts } from '../../../lib/courseAlerts'

/**
 * 미인증 · 이상 이력 카드 (`spec 023` 코스 상세 C단).
 *
 * 🔴 **고정하는 것 둘**: ① 사유 문구를 지어내지 않고 **`메모` 뱃지만** 둔다 ② **0건은
 * 좋은 상태**로 적는다(경고·빈 상태 일러스트가 아니다).
 */

const alert = (overrides: Partial<CourseAlert> = {}): CourseAlert => ({
  key: 'unchecked-900',
  kind: 'unchecked',
  title: '옥상 출입문 미인증',
  meta: '정우현',
  occurredAt: '2026-10-10T03:00:00',
  hasMemo: false,
  ...overrides,
})

const alerts = (items: CourseAlert[], totalCount = items.length): CourseAlerts => ({
  items,
  totalCount,
})

describe('CourseAlertList — 행', () => {
  it('제목·보조줄·날짜를 적는다', () => {
    render(<CourseAlertList alerts={alerts([alert()])} />)

    expect(screen.getByText('옥상 출입문 미인증')).toBeInTheDocument()
    expect(screen.getByText('정우현')).toBeInTheDocument()
    expect(screen.getByText('10.10')).toBeInTheDocument()
  })

  it('건수를 머리에 적는다', () => {
    render(<CourseAlertList alerts={alerts([alert()], 9)} />)

    expect(screen.getByText(/최근 30일 · 9건/)).toBeInTheDocument()
  })

  it('🔴 잘라냈으면 잘랐다고 적는다 — 6건만 보고 "이상 6건" 으로 읽으면 안 된다', () => {
    render(<CourseAlertList alerts={alerts([alert()], 9)} />)

    expect(screen.getByText(/9건 중 최근 1건/)).toBeInTheDocument()
  })

  it('종류가 섞여도 각각 그린다', () => {
    render(
      <CourseAlertList
        alerts={alerts([
          alert(),
          alert({ key: 'incomplete-1', kind: 'incomplete', title: '순찰 미완료', meta: '박성민 · 인증 1/3' }),
          alert({ key: 'overtime-1', kind: 'overtime', title: '소요시간 초과', meta: '김현수 · 2시간 18분 소요' }),
        ])}
      />
    )

    expect(screen.getByText('순찰 미완료')).toBeInTheDocument()
    expect(screen.getByText('소요시간 초과')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })
})

describe('CourseAlertList — 🔴 사유를 지어내지 않는다', () => {
  it('🔴 메모가 있으면 뱃지만 둔다 — 내용은 상세 조회에만 있다', () => {
    render(<CourseAlertList alerts={alerts([alert({ hasMemo: true })])} />)

    expect(screen.getByText('메모')).toBeInTheDocument()
  })

  it('메모가 없으면 뱃지도 없다', () => {
    render(<CourseAlertList alerts={alerts([alert({ hasMemo: false })])} />)

    expect(screen.queryByText('메모')).not.toBeInTheDocument()
  })
})

describe('CourseAlertList — 상태 구분', () => {
  it('🔴 0건은 **좋은 상태**로 적는다 — 경고가 아니다', () => {
    render(<CourseAlertList alerts={alerts([])} />)

    expect(screen.getByText(/이상이 없습니다/)).toBeInTheDocument()
    expect(screen.queryByText(/데이터가 없습니다/)).not.toBeInTheDocument()
  })

  it('🔴 조회 중에는 "이상 없음" 이라고 하지 않는다 — 거짓 안심을 준다', () => {
    render(<CourseAlertList alerts={alerts([])} isPending />)

    expect(screen.queryByText(/이상이 없습니다/)).not.toBeInTheDocument()
  })
})
