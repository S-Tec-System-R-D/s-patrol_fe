import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PointListCard from '../PointListCard'
import type { PointType } from '../../types'

const qrPoint: PointType = {
  id: '1',
  title: '정문 입구',
  description: '정문 CCTV 앞',
  authenticationMethod: 'QR',
}

const nfcPoint: PointType = {
  id: '2',
  title: '로비 1층',
  description: '안내 데스크',
  authenticationMethod: 'NFC',
}

describe('PointListCard', () => {
  it('이름과 QR 뱃지 렌더', () => {
    render(
      <PointListCard point={qrPoint} idx={1} selected={null} onClick={vi.fn()} />
    )
    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it('NFC 지점은 NFC 뱃지 렌더', () => {
    render(
      <PointListCard point={nfcPoint} idx={2} selected={null} onClick={vi.fn()} />
    )
    expect(screen.getByText('NFC')).toBeInTheDocument()
  })

  it('선택된 카드는 강조 스타일 적용', () => {
    render(
      <PointListCard point={qrPoint} idx={1} selected={qrPoint} onClick={vi.fn()} />
    )
    expect(screen.getByText('1')).toHaveClass('bg-point-bg')
  })

  it('선택 안 된 카드는 강조 스타일 미적용', () => {
    render(
      <PointListCard point={qrPoint} idx={1} selected={nfcPoint} onClick={vi.fn()} />
    )
    expect(screen.getByText('1')).not.toHaveClass('bg-point-bg')
  })
})
