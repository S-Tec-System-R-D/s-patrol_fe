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
 * 🔴 Phase 4 의 핵심은 **스위치가 값을 직접 바꾸지 않는 것**이다 — 확인 모달을 **요청**
 * 하기만 한다. 여기서 바로 저장하면 모달이 "눌러도 되는 관문" 이 되고, 옵티미스틱
 * 금지(규칙 11)도 함께 무너진다.
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
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.getByText('A동 1층~지하 주차장 순찰')).toBeInTheDocument()
    expect(screen.getByText('45분')).toBeInTheDocument()
  })

  it('🔴 코스명 행이 없다 — 페이지 제목이 이미 코스명이다', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.queryByText('코스명')).not.toBeInTheDocument()
    expect(screen.queryByText('A동 순찰코스')).not.toBeInTheDocument()
  })

  it('🔴 사업장명은 021 저장값에서 온다 — 코스 응답에 없다 (OQ-9)', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.getByText('강동 테크노타워')).toBeInTheDocument()
  })

  it('🔴 사업장 선택값이 없으면 빈 값으로 둔다 — 추측해 채우지 않는다', () => {
    clearSite()
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.getByText('사업장').parentElement?.textContent).toContain('-')
  })

  it('🔴 설명이 비어 있는 것은 정상이다 — 코스는 memo 를 실제로 비울 수 있다 (규칙 6)', () => {
    render(<CourseInfo course={course({ memo: null })} onRequestToggle={vi.fn()} />)

    expect(screen.getByText('설명').parentElement?.textContent).toContain('-')
    // "준비 중"(기능 없음)과 섞지 않는다 — 027 placeholder 규약
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('🔴 상태(courseStatusName)를 그리지 않는다 — 상세 응답에 없다', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.queryByText('대기중')).not.toBeInTheDocument()
    expect(screen.queryByText('상태')).not.toBeInTheDocument()
  })

  it('🔴 "총 소요시간" 은 입력란이 아니다 — 서버가 구간시간 합으로 채우는 파생 값이다 (B-31)', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('CourseInfo — 수정 버튼', () => {
  it('🔴 onEdit 을 받으면 카드 우측 상단에 아이콘 버튼을 그린다 (사용자 결정 2026-10-12)', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} onEdit={onEdit} />)

    // 🔴 아이콘만 있어도 이름이 있다(`aria-label`)
    await user.click(screen.getByRole('button', { name: '기본정보 수정' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('🔴 onEdit 이 없으면 버튼도 없다 — 읽기 전용으로 쓸 수 있다', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    expect(screen.queryByRole('button', { name: '기본정보 수정' })).not.toBeInTheDocument()
  })

  it('🔴 이 카드가 저장하지 않는다 — 모달·폼은 페이지가 들고 있다', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} onEdit={vi.fn()} />)

    // 전량 전송 규약(B-25)이 카드 안으로 새어 들어오면 안 된다
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('CourseInfo — 토글 2종 (Phase 4)', () => {
  it('교대 허용·코스 활성화가 각각 스위치 + 글자로 상태를 보여준다', () => {
    render(<CourseInfo course={course({ switchYn: false, useYn: false })} onRequestToggle={vi.fn()} />)

    // 🔴 색·위치만으로 전달하지 않는다 — 글자가 함께 있다
    expect(screen.getByText('허용 안 함')).toBeInTheDocument()
    expect(screen.getByText('미사용')).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(2)
  })

  it('🔴 코스 활성화에만 효과 한 줄이 붙는다 (A단) — 교대 허용은 효과를 모른다 (A1)', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    // ✅ OQ-023-F 로 확인된 사실이다 — 배정이 아니라 **근무자가 앱에서 고른다**
    expect(screen.getByText('· 앱 코스 목록에 노출')).toBeInTheDocument()
    // 🔴 교대 허용의 효과는 **업무 확인 전**이다. 그럴듯한 문장을 지어 넣지 않는다
    expect(screen.queryByText(/인계/)).not.toBeInTheDocument()
    expect(screen.queryByText(/나눠/)).not.toBeInTheDocument()
  })

  it('🔴 안내 문구를 카드에 두지 않는다 (사용자 결정) — 토글 보조줄이 같은 사실을 전한다', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} />)

    // 카드마다 설명 한 줄을 붙이면 읽히지 않는 글이 쌓인다
    expect(screen.queryByText(/직접 선택합니다/)).not.toBeInTheDocument()
    // 같은 사실은 토글 보조줄이 전한다
    expect(screen.getByText('· 앱 코스 목록에 노출')).toBeInTheDocument()
  })

  it('🔴 스위치는 값을 바꾸지 않고 **확인을 요청**한다 — 켜진 값이 그대로 남는다', async () => {
    const user = userEvent.setup()
    const onRequestToggle = vi.fn()
    render(<CourseInfo course={course()} onRequestToggle={onRequestToggle} />)

    await user.click(screen.getByLabelText('사용'))

    expect(onRequestToggle).toHaveBeenCalledWith('useYn', false)
    // 🔴 옵티미스틱이 아니다 — 화면은 여전히 "사용" 이다(재조회 뒤에 바뀐다)
    expect(screen.getByText('사용')).toBeInTheDocument()
    expect(screen.getByLabelText('사용')).toBeChecked()
  })

  it('🔴 교대 허용은 다른 종류로 요청한다 — 두 토글이 섞이지 않는다', async () => {
    const user = userEvent.setup()
    const onRequestToggle = vi.fn()
    render(<CourseInfo course={course({ switchYn: false })} onRequestToggle={onRequestToggle} />)

    await user.click(screen.getByLabelText('허용 안 함'))

    expect(onRequestToggle).toHaveBeenCalledWith('switchYn', true)
  })

  it('🔴 저장 중에는 스위치를 잠근다 — 연타가 전량 전송을 중복으로 만들지 않게', () => {
    render(<CourseInfo course={course()} onRequestToggle={vi.fn()} isSaving />)

    screen.getAllByRole('switch').forEach((toggle) => expect(toggle).toBeDisabled())
  })
})
