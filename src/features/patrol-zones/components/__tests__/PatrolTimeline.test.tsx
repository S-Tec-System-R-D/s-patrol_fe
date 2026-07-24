import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import PatrolTimeline from '../PatrolTimeline'
import type { ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'

const patrol: ZonePatrolType = {
  name: 'B동 순찰코스',
  startedAt: new Date(2026, 4, 1, 10, 0),
  endedAt: new Date(2026, 4, 1, 10, 45),
  result: 'INCOMPLETE',
  points: [
    { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 1, 10, 10), note: '' },
    {
      name: 'B동 계단실',
      status: false,
      completedAt: new Date(2026, 4, 1, 10, 25),
      note: '비상구 잠금 해제 상태 확인됨',
    },
  ],
}

describe('PatrolTimeline', () => {
  it('순찰 시작/종료 카드 렌더', () => {
    render(<PatrolTimeline patrol={patrol} />)
    expect(screen.getByText('순찰 시작')).toBeInTheDocument()
    expect(screen.getByText('순찰 종료')).toBeInTheDocument()
  })

  it('정상 지점(status=true, note 없음) → 특이사항 뱃지/노트 미표시', () => {
    render(<PatrolTimeline patrol={patrol} />)
    expect(screen.getByText('B동 후문')).toBeInTheDocument()
    const normalCard = screen.getByText('B동 후문').closest('div')
    expect(normalCard).not.toHaveTextContent('특이사항')
  })

  it('특이사항 지점(status=false) → 자동 펼침 — 뱃지 + 노트 텍스트 표시', () => {
    render(<PatrolTimeline patrol={patrol} />)
    expect(screen.getByText('B동 계단실')).toBeInTheDocument()
    expect(screen.getByText('특이사항')).toBeInTheDocument()
    expect(screen.getByText('비상구 잠금 해제 상태 확인됨')).toBeInTheDocument()
  })
})
