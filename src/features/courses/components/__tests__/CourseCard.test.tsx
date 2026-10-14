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

  it('🔴 **"최근 순찰" 줄이 없다** (spec 034, 사용자 결정 2026-10-14)', () => {
    // 좁은 폭에서는 **고르는 데 쓰는 값**만 남긴다(spec 030 §3 규칙 5).
    // ⚠️ 테이블(`xl` 이상)에는 컬럼으로 **그대로 남아 있다**
    render(<>{CourseCard(course())}</>)

    expect(screen.queryByText(/최근 순찰/)).not.toBeInTheDocument()
    expect(screen.queryByText(/기록 없음/)).not.toBeInTheDocument()
  })

  it('타일 아이콘과 꺾쇠가 있다 — 행의 시작점을 고정하고 "들어갈 수 있다" 를 말한다', () => {
    const { container } = render(<>{CourseCard(course())}</>)

    expect(container.querySelector('.size-11')).not.toBeNull()
    expect(container.querySelector('.lucide-chevron-right')).not.toBeNull()
  })

  it('🔴 미사용이면 **타일도 함께 가라앉는다** — 타일만 밝으면 멀쩡해 보인다', () => {
    const { container } = render(<>{CourseCard(course({ useYn: false }))}</>)

    expect(container.querySelector('.size-11')?.className).toContain('bg-muted')
  })
})

/**
 * 🔴🔴 **뱃지 색이 지워지는 함정** (2026-10-14 실제로 겪었다).
 *
 * `AppBadge` 는 `cn(badgeVariants(variant), className)` 로 병합한다. 여기에 **폰트 크기
 * 토큰**(`text-label`)을 넘기면 **`tailwind-merge` 가 그것을 글자색으로 분류해** variant 의
 * 색을 **지워 버린다** — 뱃지 글자가 전부 검정이 된다. 임의값(`text-[10.5px]`)은 폰트
 * 크기로 인식되어 충돌하지 않는다.
 */
describe('CourseCard — 뱃지 색 유지', () => {
  it('🔴 크기를 줄여도 variant 색이 남아 있다', () => {
    render(<>{CourseCard(course())}</>)

    const badge = screen.getByText('사용')
    expect(badge.className).toContain('text-success-foreground')
    // 크기는 줄었다
    expect(badge.className).toContain('text-[10.5px]')
  })

  it('미사용 뱃지도 마찬가지다', () => {
    render(<>{CourseCard(course({ useYn: false }))}</>)

    expect(screen.getByText('미사용').className).toContain('text-muted-foreground')
  })
})
