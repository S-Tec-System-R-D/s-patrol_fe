import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PatrolRecordDialog from '../PatrolRecordDialog'
import type { PointPatrolType } from '@/pages/service/patrol/points/PatrolPointsPage'

const patrol: PointPatrolType = {
  zoneName: 'A동 순찰코스',
  pointName: '로비 1층',
  patrolAt: new Date(2026, 4, 1, 9, 13),
  authMethod: 'QR',
  worker: '김민준',
  result: 'RECORDED',
  records: [
    {
      recordedAt: new Date(2026, 4, 1, 9, 13),
      content: '안내 데스크 인근 바닥에 물기 발견',
      photoCount: 2,
      maxPhotoCount: 3,
    },
    {
      recordedAt: new Date(2026, 4, 1, 9, 14),
      content: '소화기 압력 게이지 정상 확인',
      photoCount: 0,
      maxPhotoCount: 3,
    },
  ],
}

describe('PatrolRecordDialog', () => {
  it('patrol이 null이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<PatrolRecordDialog patrol={null} onOpenChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('기록 N건을 리스트로 렌더 — 각 항목 내용/첨부사진 개수 표시', () => {
    render(<PatrolRecordDialog patrol={patrol} onOpenChange={vi.fn()} />)

    expect(screen.getByText('안내 데스크 인근 바닥에 물기 발견')).toBeInTheDocument()
    expect(screen.getByText('소화기 압력 게이지 정상 확인')).toBeInTheDocument()
    expect(screen.getByText('첨부 사진 (2/3)')).toBeInTheDocument()
    expect(screen.getByText('첨부 사진 (0/3)')).toBeInTheDocument()
    expect(screen.getByText('첨부된 사진이 없습니다')).toBeInTheDocument()
  })

  it('순찰코스/순찰자 정보 렌더', () => {
    render(<PatrolRecordDialog patrol={patrol} onOpenChange={vi.fn()} />)
    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('김민준')).toBeInTheDocument()
  })
})
