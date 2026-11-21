import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CourseInfo from '../CourseInfo'
import { clearSite, setSite } from '@/lib/auth/site'
import type { CourseDetail } from '../../../types'

/**
 * 코스 기본정보 (`spec 023` T359 → **Phase 4 에서 토글 2종 추가**).
 *
 * 🔴 핵심은 **사업장명이 코스 응답에서 오지 않는다**는 것이다(OQ-9) — `spec 021` 이
 * 저장한 선택값에서 온다. 그 연결이 끊기면 화면에 빈칸이 생기는 게 아니라 **엉뚱한
 * 사업장 이름**이 남을 수 있으므로(이전 선택값) 여기서 고정한다.
 *
 * 🔄 `spec 074`: 스위치를 걷고 **글자만** 남겼다 — 바꾸기는 카드 제목 줄 `수정` → 모달(2026-11-13 머리에서 카드로).
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
  it('설명·기준 소요시간을 보여준다', () => {
    render(<CourseInfo onEdit={() => {}} course={course()} />)

    expect(screen.getByText('A동 1층~지하 주차장 순찰')).toBeInTheDocument()
    expect(screen.getByText('45분')).toBeInTheDocument()
  })

  it('🔴 코스명 행이 없다 — 페이지 제목이 이미 코스명이다', () => {
    render(<CourseInfo onEdit={() => {}} course={course()} />)

    expect(screen.queryByText('코스명')).not.toBeInTheDocument()
    expect(screen.queryByText('A동 순찰코스')).not.toBeInTheDocument()
  })

  it('🔴 사업장명은 021 저장값에서 온다 — 코스 응답에 없다 (OQ-9)', () => {
    render(<CourseInfo onEdit={() => {}} course={course()} />)

    expect(screen.getByText('강동 테크노타워')).toBeInTheDocument()
  })

  it('🔴 사업장 선택값이 없으면 빈 값으로 둔다 — 추측해 채우지 않는다', () => {
    clearSite()
    render(<CourseInfo onEdit={() => {}} course={course()} />)

    expect(screen.getByText('사업장').parentElement?.textContent).toContain('-')
  })

  it('🔴 설명이 비어 있는 것은 정상이다 — 코스는 memo 를 실제로 비울 수 있다 (규칙 6)', () => {
    render(<CourseInfo onEdit={() => {}} course={course({ memo: null })} />)

    expect(screen.getByText('설명').parentElement?.textContent).toContain('-')
    // "준비 중"(기능 없음)과 섞지 않는다 — 027 placeholder 규약
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('🔴 목록의 상태(courseStatusName)를 그리지 않는다 — 상세 응답에 없다 · `상태` 행은 `useYn` 이다', () => {
    render(<CourseInfo onEdit={() => {}} course={course()} />)

    expect(screen.queryByText('대기중')).not.toBeInTheDocument()
  })

  it('🔴 "총 소요시간" 은 입력란이 아니다 — 서버가 구간시간 합으로 채우는 파생 값이다 (B-31)', () => {
    render(<CourseInfo onEdit={() => {}} course={course()} />)

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('CourseInfo — 읽기 전용 (spec 074)', () => {
  it('🔴 스위치가 없다 — 교대 · 사용 여부는 `수정` 모달에서 바꾼다 · `수정` 은 카드 제목 줄', async () => {
    const onEdit = vi.fn()
    render(<CourseInfo onEdit={onEdit} course={course()} />)

    expect(screen.queryByRole('switch')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '기본정보 편집' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('교대 · 상태를 글자로 — 효과 문구는 적지 않는다', () => {
    render(<CourseInfo onEdit={() => {}} course={course({ switchYn: false })} />)

    expect(screen.getByText('교대').parentElement?.textContent).toContain('허용 안 함')
    expect(screen.getByText('상태').parentElement?.textContent).toContain('사용')
    expect(screen.queryByText('앱 코스 목록에 노출')).toBeNull()
  })

  it('미사용이면 미사용', () => {
    render(<CourseInfo onEdit={() => {}} course={course({ useYn: false })} />)

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })
})
