import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import CoursePointList from '../CoursePointList'
import type { CourseDetailPoint } from '../../../types'

/**
 * 지점 순서 카드 — **읽기 전용**(`spec 023` T358).
 *
 * 여기서 고정하는 것은 "무엇을 **안** 하는가" 가 절반이다: 편집 수단 없음(Phase 4) ·
 * 활성 토글 없음(B-29 철회 — 코스에서 바꿀 값이 아니다) · 구간 메모 없음(B-30 — 쓰기 전용).
 */

const point = (overrides: Partial<CourseDetailPoint> = {}): CourseDetailPoint => ({
  coursePointSeq: 101,
  pointSeq: 1,
  pointName: '정문 입구',
  authMethod: 9,
  orderNo: 1,
  useYn: true,
  courseMin: 10, gpsLat: null, gpsLng: null,
  ...overrides,
})

const renderList = (points: CourseDetailPoint[]) =>
  render(
    <MemoryRouter>
      <CoursePointList points={points} />
    </MemoryRouter>
  )

describe('CoursePointList — 목록', () => {
  it('orderNo 순으로 그린다 — 응답 순서를 믿지 않는다', () => {
    renderList([
      point({ coursePointSeq: 103, pointSeq: 3, pointName: '세번째', orderNo: 3 }),
      point({ coursePointSeq: 101, pointSeq: 1, pointName: '첫번째', orderNo: 1 }),
      point({ coursePointSeq: 102, pointSeq: 2, pointName: '두번째', orderNo: 2 }),
    ])

    const names = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(names[0]).toContain('첫번째')
    expect(names[1]).toContain('두번째')
    expect(names[2]).toContain('세번째')
  })

  it('구간 시간과 총 개수를 보여준다', () => {
    renderList([point({ courseMin: 15 })])

    expect(screen.getByText('15분')).toBeInTheDocument()
    expect(screen.getByText('총 1개')).toBeInTheDocument()
  })

  it('인증수단 뱃지를 정수 코드에서 만든다', () => {
    renderList([point({ authMethod: 10 })])

    expect(screen.getByText('NFC')).toBeInTheDocument()
  })

  it('🔴 모르는 인증수단 코드는 뱃지를 숨긴다', () => {
    renderList([point({ authMethod: 99 })])

    expect(screen.queryByText('QR')).not.toBeInTheDocument()
    expect(screen.queryByText('NFC')).not.toBeInTheDocument()
  })

  it('미사용 지점은 뱃지로 글자를 준다 — 색·명도만으로 전달하지 않는다', () => {
    renderList([point({ useYn: false })])

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })
})

describe('CoursePointList — 빈 상태', () => {
  it('편성된 지점이 0개면 빈 상태를 보여준다', () => {
    renderList([])

    expect(screen.getByText('편성된 지점이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('총 0개')).toBeInTheDocument()
  })

  it('🔴 "준비 중" 이 아니다 — 기능은 있고 데이터가 없는 것이다 (027 규약)', () => {
    renderList([])

    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('🔴 지점 0개를 경고로 다루지 않는다 — 자동 조치도 없다 (규칙 12)', () => {
    renderList([])

    expect(screen.queryByText(/비활성/)).not.toBeInTheDocument()
    expect(screen.queryByText(/확인이 필요/)).not.toBeInTheDocument()
  })
})

describe('CoursePointList — 편집 진입', () => {
  it('🔴 onEdit 을 받지 않으면 버튼이 없다 — 읽기 전용으로 쓸 수 있다', () => {
    renderList([point()])

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('🔴 편집 수단은 **카드 우측 상단 아이콘 버튼 하나**다 (사용자 결정 2026-10-12)', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <MemoryRouter>
        <CoursePointList points={[point()]} onEdit={onEdit} />
      </MemoryRouter>
    )

    // 행에는 조작 수단이 없다 — 제거·순서 변경은 편집 모드 안에서만
    expect(screen.queryByRole('button', { name: /제거/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()

    // 🔴 아이콘만 있어도 **이름이 있다** — `aria-label` 이 없으면 스크린리더에
    // "버튼" 으로만 읽힌다
    await user.click(screen.getByRole('button', { name: '지점 편성 편집' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('🔴 "준비 중" 안내를 더 쓰지 않는다 — 편성은 이제 동작한다', () => {
    renderList([point()])

    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument()
  })
})

describe('CoursePointList — 아직 두지 않는 것', () => {

  it('🔴 지점별 활성 토글이 없다 — 코스에서 바꿀 값이 아니다 (B-29 철회)', () => {
    renderList([point({ useYn: false })])

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('🔴 구간 메모를 그리지 않는다 — 서버가 돌려주지 않는다 (B-30)', () => {
    renderList([{ ...point(), memo: '구간 메모' } as CourseDetailPoint])

    expect(screen.queryByText('구간 메모')).not.toBeInTheDocument()
  })
})
