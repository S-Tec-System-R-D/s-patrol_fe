import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CourseCard from '../CourseCard'
import type { CourseRow } from '../../types'

/**
 * 코스 목록 카드 (`spec 030` T450).
 *
 * 🔴 **카드는 컬럼을 줄인 것이지 값을 바꾼 것이 아니다.** 테이블과 **다른 사실**을 말하면
 * 좁은 폭에서만 틀린 화면이 된다 — 여기서 그것을 건다.
 */

const course = (over: Partial<CourseRow> = {}): CourseRow => ({
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  switchYn: true,
  totalMin: 25,
  courseStatusCode: 0,
  courseStatusName: '대기중',
  pointCount: 3,
  history: {
    historySeq: 1,
    historyUserSeq: 13,
    historyUserName: '김근무',
    historyStatusCode: 1,
    historyStatusName: '완료',
    historyEndDt: '2026-10-12T12:58:39',
  },
  ...over,
})

describe('CourseCard', () => {
  it('코스명과 상태 뱃지를 앞에 둔다', () => {
    render(<>{CourseCard(course())}</>)

    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('사용')).toBeInTheDocument()
    expect(screen.getByText('교대 허용')).toBeInTheDocument()
  })

  it('🔴 교대는 양쪽 다 뱃지다 — 한쪽만 표시하면 빈 칸이 "누락" 으로 읽힌다', () => {
    render(<>{CourseCard(course({ switchYn: false }))}</>)

    expect(screen.getByText('교대 없음')).toBeInTheDocument()
  })

  it('미사용 코스는 뱃지로 알린다 — 색만으로 전하지 않는다', () => {
    render(<>{CourseCard(course({ useYn: false }))}</>)

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('🔴 지점 0개도 그대로 보여준다 — 경고하지 않는다 (spec 023 규칙 12)', () => {
    render(<>{CourseCard(course({ pointCount: 0 }))}</>)

    expect(screen.getByText('지점 0개')).toBeInTheDocument()
  })

  it('🔴 이력이 없으면 "기록 없음" — 빈칸으로 두지 않는다', () => {
    render(<>{CourseCard(course({ history: null }))}</>)

    expect(screen.getByText(/기록 없음/)).toBeInTheDocument()
  })
})
