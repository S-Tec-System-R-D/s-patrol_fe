import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PointCard from '../PointCard'
import type { PointRow } from '../../types'

/** 지점 목록 카드 (`spec 030` T450). 카드는 컬럼을 줄인 것이지 값을 바꾼 것이 아니다 */

const point = (over: Partial<PointRow> = {}): PointRow => ({
  pointSeq: 1,
  pointName: '정문 입구',
  memo: '정문 CCTV 앞',
  authMethod: 9,
  authMethodName: 'QR',
  usedCount: 2,
  useYn: true,
  nfcTagId: null,
  lastPatrolDt: '2026-10-13T09:07:00',
  ...over,
})

describe('PointCard', () => {
  it('지점명과 상태·인증수단 뱃지를 앞에 둔다', () => {
    render(<>{PointCard(point())}</>)

    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('사용')).toBeInTheDocument()
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it('미사용 지점은 뱃지로 알린다', () => {
    render(<>{PointCard(point({ useYn: false }))}</>)

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('🔴 인증수단 라벨이 없으면 뱃지를 만들지 않는다 — 없는 이름을 지어내지 않는다(A1)', () => {
    render(<>{PointCard(point({ authMethod: 99, authMethodName: '' }))}</>)

    expect(screen.queryByText('QR')).not.toBeInTheDocument()
    expect(screen.queryByText('NFC')).not.toBeInTheDocument()
    // 지점명·사용여부는 그대로 보인다
    expect(screen.getByText('정문 입구')).toBeInTheDocument()
  })

  it('🔴 순찰 이력이 없으면 "기록 없음"', () => {
    render(<>{PointCard(point({ lastPatrolDt: null }))}</>)

    expect(screen.getByText(/기록 없음/)).toBeInTheDocument()
  })
})
