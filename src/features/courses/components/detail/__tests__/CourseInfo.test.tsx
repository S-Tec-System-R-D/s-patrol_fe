import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import CourseInfo from '../CourseInfo'
import { clearSite, setSite } from '@/lib/auth/site'
import type { CourseDetail } from '../../../types'

/**
 * 코스 기본정보 (`spec 023` T359).
 *
 * 🔴 핵심은 **사업장명이 코스 응답에서 오지 않는다**는 것이다(OQ-9) — `spec 021` 이
 * 저장한 선택값에서 온다. 그 연결이 끊기면 화면에 빈칸이 생기는 게 아니라 **엉뚱한
 * 사업장 이름**이 남을 수 있으므로(이전 선택값) 여기서 고정한다.
 */

const course = (overrides: Partial<CourseDetail> = {}): CourseDetail => ({
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  memo: 'A동 1층~지하 주차장 순찰',
  useYn: true,
  switchYn: true,
  totalMin: 45,
  points: [],
  ...overrides,
})

beforeEach(() => {
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearSite()
})

describe('CourseInfo', () => {
  it('설명·총 소요시간을 보여준다', () => {
    render(<CourseInfo course={course()} />)

    expect(screen.getByText('A동 1층~지하 주차장 순찰')).toBeInTheDocument()
    expect(screen.getByText('45분')).toBeInTheDocument()
  })

  it('🔴 코스명 행이 없다 — 페이지 제목이 이미 코스명이다', () => {
    render(<CourseInfo course={course()} />)

    expect(screen.queryByText('코스명')).not.toBeInTheDocument()
    expect(screen.queryByText('A동 순찰코스')).not.toBeInTheDocument()
  })

  it('🔴 사업장명은 021 저장값에서 온다 — 코스 응답에 없다 (OQ-9)', () => {
    render(<CourseInfo course={course()} />)

    expect(screen.getByText('강동 테크노타워')).toBeInTheDocument()
  })

  it('🔴 사업장 선택값이 없으면 빈 값으로 둔다 — 추측해 채우지 않는다', () => {
    clearSite()
    render(<CourseInfo course={course()} />)

    expect(screen.getByText('사업장').parentElement?.textContent).toContain('—')
  })

  it('🔴 설명이 비어 있는 것은 정상이다 — 코스는 memo 를 실제로 비울 수 있다 (규칙 6)', () => {
    render(<CourseInfo course={course({ memo: null })} />)

    expect(screen.getByText('설명').parentElement?.textContent).toContain('—')
    // "준비 중"(기능 없음)과 섞지 않는다 — 027 placeholder 규약
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('교대 허용/허용 안 함을 구분해 보여준다', () => {
    render(<CourseInfo course={course({ switchYn: false })} />)

    expect(screen.getByText('허용 안 함')).toBeInTheDocument()
  })

  it('코스 활성화를 뱃지로 보여준다', () => {
    render(<CourseInfo course={course({ useYn: false })} />)

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('🔴 상태(courseStatusName)를 그리지 않는다 — 상세 응답에 없다', () => {
    render(<CourseInfo course={course()} />)

    expect(screen.queryByText('대기중')).not.toBeInTheDocument()
    expect(screen.queryByText('상태')).not.toBeInTheDocument()
  })

  it('🔴 토글·수정 수단이 없다 — Phase 4 다', () => {
    render(<CourseInfo course={course()} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})
