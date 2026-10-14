import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ZoneHistoryCard from '../ZoneHistoryCard'
import type { ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'

/**
 * 코스 이력 카드 (`spec 030` T450).
 *
 * ⚠️ 이 화면은 아직 mock 위다(`Date` 필드) — `spec 025` 전환 때 **매핑만** 바뀌고
 * 아래 단언들(제목·결과 뱃지·진행 중 표기)은 그대로 유효해야 한다.
 */

const zone = (over: Partial<ZonePatrolType> = {}): ZonePatrolType => ({
  name: 'A동 순찰코스',
  startedAt: new Date('2026-10-13T09:00:00'),
  endedAt: new Date('2026-10-13T09:40:00'),
  result: 'COMPLETE',
  points: [],
  ...over,
})

describe('ZoneHistoryCard', () => {
  it('코스명과 결과 뱃지를 앞에 둔다', () => {
    render(<>{ZoneHistoryCard(zone())}</>)

    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('완료')).toBeInTheDocument()
  })

  it('시작·종료를 모두 보여준다', () => {
    render(<>{ZoneHistoryCard(zone())}</>)

    expect(screen.getByText(/2026-10-13 09:00:00/)).toBeInTheDocument()
    expect(screen.getByText(/2026-10-13 09:40:00/)).toBeInTheDocument()
  })

  it('🔴 진행 중이면 종료를 `—` 가 아니라 "진행 중" 으로 적는다', () => {
    // 테이블에서는 같은 열의 다른 행과 비교돼 `—` 가 읽히지만, 카드에서는 그 줄 하나만
    // 보이므로 **값이 빠진 것처럼** 읽힌다
    render(<>{ZoneHistoryCard(zone({ result: 'IN_PROGRESS' }))}</>)

    expect(screen.getByText(/종료 진행 중/)).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })
})
