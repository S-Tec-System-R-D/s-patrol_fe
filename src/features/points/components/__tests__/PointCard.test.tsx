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
  it('지점명과 사용여부 뱃지를 앞에 둔다 — 인증수단은 **타일**이 맡는다 (spec 034)', () => {
    const { container } = render(<>{PointCard(point())}</>)

    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('사용')).toBeInTheDocument()
    expect(container.querySelector('.lucide-qr-code')).not.toBeNull()
  })

  it('미사용 지점은 뱃지로 알린다', () => {
    render(<>{PointCard(point({ useYn: false }))}</>)

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('🔴 인증수단 **뱃지를 두지 않는다** — 타일이 같은 일을 한다 (spec 034)', () => {
    // 같은 정보가 한 행에 두 번이면 좁은 폭에서 이름이 밀린다(사용자 결정 2026-10-14)
    render(<>{PointCard(point())}</>)

    expect(screen.queryByText('QR')).not.toBeInTheDocument()
    expect(screen.getByText('사용')).toBeInTheDocument()
  })

  it('🔴 타일에 **이름을 남긴다** — 뱃지를 뺐으므로 인증수단을 전하는 유일한 요소다', () => {
    render(<>{PointCard(point({ authMethod: 10, authMethodName: 'NFC' }))}</>)

    // 스크린리더에서 사라지면 목록에서 인증수단을 알 길이 없다
    expect(screen.getByRole('img', { name: '인증수단 NFC' })).toBeInTheDocument()
  })

  it('🔴 **"최근 순찰" 줄이 없다** (spec 034)', () => {
    render(<>{PointCard(point())}</>)

    expect(screen.queryByText(/최근 순찰/)).not.toBeInTheDocument()
  })

  it('🔴 **타일이 인증수단으로 갈린다** — QR 과 NFC 가 다른 색·아이콘이다 (spec 034)', () => {
    const qr = render(<>{PointCard(point({ authMethod: 9, authMethodName: 'QR' }))}</>)
    expect(qr.container.querySelector('.size-11')?.className).toContain('bg-point-bg')
    expect(qr.container.querySelector('.lucide-qr-code')).not.toBeNull()
    qr.unmount()

    const nfc = render(<>{PointCard(point({ authMethod: 10, authMethodName: 'NFC' }))}</>)
    expect(nfc.container.querySelector('.size-11')?.className).toContain('bg-success-bg')
    expect(nfc.container.querySelector('.lucide-nfc')).not.toBeNull()
  })

  it('🔴 미실측 코드는 **중립 타일**이다 — 추측 아이콘을 만들지 않는다(A1)', () => {
    const { container } = render(<>{PointCard(point({ authMethod: 99, authMethodName: '' }))}</>)

    expect(container.querySelector('.size-11')?.className).toContain('bg-muted')
    expect(container.querySelector('.lucide-qr-code')).toBeNull()
    expect(container.querySelector('.lucide-nfc')).toBeNull()
  })

  it('⚠️ 색만이 아니라 **아이콘 모양도 함께 바뀐다** — 색각 이상에서도 구분이 남는다', () => {
    const qr = render(<>{PointCard(point({ authMethod: 9, authMethodName: 'QR' }))}</>)
    expect(qr.container.querySelector('.lucide-qr-code')).not.toBeNull()
    qr.unmount()

    const nfc = render(<>{PointCard(point({ authMethod: 10, authMethodName: 'NFC' }))}</>)
    expect(nfc.container.querySelector('.lucide-nfc')).not.toBeNull()
    expect(nfc.container.querySelector('.lucide-qr-code')).toBeNull()
  })
})
