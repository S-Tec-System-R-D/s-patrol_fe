import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { pointHistoryCard } from '../PointHistoryCard'
import type { PointPatrolType } from '@/pages/service/patrol/points/PatrolPointsPage'

/**
 * 지점 이력 카드 (`spec 030` T450) — **컬럼이 8개로 가장 많은 화면**이다.
 *
 * ⚠️ 아직 mock 위다(`Date`) — `spec 024` 전환 때 매핑만 바뀐다.
 */

const patrol = (over: Partial<PointPatrolType> = {}): PointPatrolType => ({
  zoneName: 'A동 순찰코스',
  pointName: '정문 입구',
  patrolAt: new Date('2026-10-13T09:07:00'),
  authMethod: 'QR',
  worker: '김근무',
  result: 'NORMAL',
  records: [],
  ...over,
})

const renderCard = (row: PointPatrolType, onRecordClick = vi.fn()) => {
  render(<>{pointHistoryCard(onRecordClick)(row)}</>)
  return { onRecordClick }
}

describe('PointHistoryCard', () => {
  it('지점명 + 결과·인증 뱃지를 앞에, 나머지는 한 줄로 묶는다', () => {
    renderCard(patrol())

    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('이상없음')).toBeInTheDocument()
    expect(screen.getByText('QR')).toBeInTheDocument()
    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('김근무')).toBeInTheDocument()
  })

  it('🔴 기록이 0건이면 버튼을 만들지 않는다 — 눌러도 아무 일 없는 버튼이 된다', () => {
    renderCard(patrol())

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('기록이 있으면 버튼으로 모달을 연다', async () => {
    const user = userEvent.setup()
    const { onRecordClick } = renderCard(
      patrol({
        records: [
          {
            recordedAt: new Date('2026-10-13T09:07:00'),
            content: '조명 고장',
            photoCount: 1,
            maxPhotoCount: 3,
          },
        ],
      })
    )

    await user.click(screen.getByRole('button', { name: /기록 1건/ }))

    expect(onRecordClick).toHaveBeenCalledTimes(1)
  })

  it('미완료는 시각을 적지 않는다 — 테이블과 같은 규칙', () => {
    renderCard(patrol({ result: 'INCOMPLETE' }))

    expect(screen.getByText('2026-10-13')).toBeInTheDocument()
    expect(screen.queryByText(/09:07/)).not.toBeInTheDocument()
  })
})
