import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PointListCard from '../PointListCard'
import type { PointRow } from '../../types'

/**
 * 022에서 fixture와 prop이 함께 바뀌었다.
 * - fixture: mock `PointType`(`id`·`title`) → 서버 `PointRow`(`pointSeq`·`pointName`)
 * - prop: `selected: PointType | null`(참조 동등 비교) → `selected: boolean`
 *
 * 🔴 참조 동등을 버린 이유: 서버 응답은 재조회마다 새 객체라 `point === selected` 가
 * 항상 false 가 되어 선택 표시가 사라진다.
 */
const row = (overrides: Partial<PointRow> = {}): PointRow => ({
  pointSeq: 1,
  pointName: '정문 입구',
  memo: '정문 CCTV 앞',
  authMethod: 9,
  authMethodName: 'QR',
  usedCount: 0,
  useYn: true,
  nfcTagId: null,
  lastPatrolDt: null,
  ...overrides,
})

const nfcRow = row({
  pointSeq: 2,
  pointName: '로비 1층',
  authMethod: 10,
  authMethodName: 'NFC',
  nfcTagId: '04A1B2C3D4E5F6',
})

describe('PointListCard', () => {
  it('이름과 QR 뱃지 렌더', () => {
    render(<PointListCard point={row()} idx={1} selected={false} onClick={vi.fn()} />)
    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it('NFC 지점은 NFC 뱃지 렌더', () => {
    render(<PointListCard point={nfcRow} idx={2} selected={false} onClick={vi.fn()} />)
    expect(screen.getByText('NFC')).toBeInTheDocument()
  })

  it('선택된 카드는 강조 스타일 적용', () => {
    render(<PointListCard point={row()} idx={1} selected onClick={vi.fn()} />)
    expect(screen.getByText('1')).toHaveClass('bg-point')
  })

  it('선택 안 된 카드는 강조 스타일 미적용', () => {
    render(<PointListCard point={row()} idx={1} selected={false} onClick={vi.fn()} />)
    expect(screen.getByText('1')).not.toHaveClass('bg-point')
  })

  it('클릭하면 pointSeq를 넘긴다 — 목록 객체가 아니다', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<PointListCard point={row({ pointSeq: 42 })} idx={1} selected={false} onClick={onClick} />)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledWith(42)
  })

  it('서버 표시명이 비어도 매핑표 라벨로 뱃지를 그린다 (B-6)', () => {
    render(
      <PointListCard
        point={row({ authMethodName: '' })}
        idx={1}
        selected={false}
        onClick={vi.fn()}
      />
    )
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  /**
   * 🔴 미사용 지점 구분 — 실측(Phase 8)에서 **서버가 목록에서 제외하지 않는 것**이
   * 확인됐으므로 구분은 프론트 책임이다(OQ-022-G).
   */
  describe('미사용(useYn: false) 지점', () => {
    it('이름을 톤다운한다', () => {
      const { container } = render(
        <PointListCard point={row({ useYn: false })} idx={1} selected={false} onClick={vi.fn()} />
      )
      expect(container.querySelector('.text-muted-foreground')).not.toBeNull()
    })

    it('사용 지점은 톤다운하지 않는다', () => {
      render(<PointListCard point={row({ useYn: true })} idx={1} selected={false} onClick={vi.fn()} />)
      // 사용 지점에는 미사용 표시가 없다
      expect(screen.queryByText(/미사용/)).not.toBeInTheDocument()
    })

    it('🔴 색·명도만으로 전달하지 않는다 — 접근 가능한 이름에 "미사용"이 들어간다', () => {
      // design-system.md §3 "색만으로 상태 전달 금지". 톤다운만 하면 스크린리더에
      // 아무 정보도 가지 않는다.
      render(<PointListCard point={row({ useYn: false })} idx={1} selected={false} onClick={vi.fn()} />)
      expect(screen.getByRole('button')).toHaveAccessibleName(/미사용/)
    })

    it('인증수단 뱃지도 함께 톤다운한다 (라벨은 유지)', () => {
      render(<PointListCard point={row({ useYn: false })} idx={1} selected={false} onClick={vi.fn()} />)
      // 라벨 자체는 숨기지 않는다 — 인증수단 정보는 여전히 필요하다
      expect(screen.getByText('QR')).toBeInTheDocument()
    })
  })

  it('미실측 코드 + 표시명 없음이면 뱃지를 숨긴다 — 없는 라벨을 만들지 않는다', () => {
    render(
      <PointListCard
        point={row({ authMethod: 99, authMethodName: '' })}
        idx={1}
        selected={false}
        onClick={vi.fn()}
      />
    )
    expect(screen.queryByText('QR')).not.toBeInTheDocument()
    expect(screen.queryByText('NFC')).not.toBeInTheDocument()
  })
})
