import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import PointDetail from '../PointDetail'
import type { PointDetail as PointDetailData } from '../../../types'

/**
 * 지점 상세 **속성 패널**의 표시 계약 — `spec 076`(시안 개선 B). 이전 `027` 본문 ·
 * `029` 소속 코스 · 자격증명 카드를 패널 하나로 합쳤다.
 *
 * 🔴 수정 · 삭제 흐름은 `PointDetailPage.test.tsx` 가 본다. 여기는 **순수 표시**만 본다.
 */

const detail = (overrides: Partial<PointDetailData> = {}): PointDetailData => ({
  pointSeq: 1,
  name: '정문 입구',
  memo: '정문 CCTV 앞',
  authMethod: 9,
  authMethodName: 'QR',
  qrCode: 'STSP1:7:1:1760000000:mockSignature',
  nfcTagId: null,
  gpsLat: null,
  gpsLng: null,
  useYn: true,
  lastPatrolDt: '2026-10-02T09:11:00',
  lastPatrolUserSeq: 101,
  lastPatrolUserName: '김근무',
  courseList: [{ courseSeq: 1, courseName: 'A동 순찰코스' }],
  ...overrides,
})

const renderDetail = (point = detail(), onEdit?: () => void) =>
  render(
    <MemoryRouter>
      <PointDetail point={point} onEdit={onEdit} />
    </MemoryRouter>
  )

describe('PointDetail — 속성 패널 (spec 076)', () => {
  it('행 구성 — 인증수단 · 소속 코스 · 사업장 · 설명 · 좌표', () => {
    renderDetail()

    for (const label of ['인증수단', '소속 코스', '사업장', '설명', '좌표']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('🔴 지점명 행 · 사용여부 · 최근 순찰 행이 없다 — 머리 · 인증 기록이 갖는다 (D4)', () => {
    renderDetail()

    expect(screen.queryByText('지점명')).not.toBeInTheDocument()
    expect(screen.queryByText('사용여부')).not.toBeInTheDocument()
    expect(screen.queryByText('최근 순찰')).not.toBeInTheDocument()
  })

  it('수정은 기본정보 제목 줄에 있다 (D3)', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    renderDetail(detail(), onEdit)

    await user.click(screen.getByRole('button', { name: '기본정보 수정' }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('🔴 좌표가 없으면 행은 `-`, 지도 자리는 빗금 칸에 안내', () => {
    renderDetail(detail({ gpsLat: null, gpsLng: null }))

    expect(screen.getByText('좌표').parentElement).toHaveTextContent('-')
    expect(screen.getByText('등록된 좌표가 없습니다')).toBeInTheDocument()
  })

  it('🔴 범위 밖 좌표(B-33)도 지도에 찍지 않는다', () => {
    renderDetail(detail({ gpsLat: 123, gpsLng: 57.22 }))

    expect(screen.getByText('등록된 좌표가 없습니다')).toBeInTheDocument()
  })

  it('소속 코스가 여러 개면 모두 코스 상세 링크다', () => {
    renderDetail(
      detail({
        courseList: [
          { courseSeq: 1, courseName: 'A동 순찰코스' },
          { courseSeq: 2, courseName: 'B동 야간코스' },
        ],
      })
    )

    expect(screen.getByRole('link', { name: 'A동 순찰코스' })).toHaveAttribute('href', '/zones/1')
    expect(screen.getByRole('link', { name: 'B동 야간코스' })).toHaveAttribute('href', '/zones/2')
  })

  it('소속 코스가 0건이면 안내를 보여준다', () => {
    renderDetail(detail({ courseList: [] }))

    expect(screen.getByText('소속된 코스가 없습니다')).toBeInTheDocument()
  })

  it('🔴 QR/NFC 전환 스위치가 없다 — 인증수단은 수정 창에서 바꾼다', () => {
    renderDetail()

    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.queryByText('출력 후 현장 부착')).not.toBeInTheDocument()
  })
})

describe('PointDetail — 인증수단별 자격증명', () => {
  it('🔴 NFC 지점은 TAG ID 를 보여 주고 복사할 수 있다', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderDetail(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: '04A1B2C3D4E5F6' }))

    expect(screen.getByText('04A1B2C3D4E5F6')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'TAG ID 복사' }))
    expect(writeText).toHaveBeenCalledWith('04A1B2C3D4E5F6')
  })

  it('NFC 인데 TAG ID 가 없으면 등록 안내를 보여준다 (B-13 — 서버가 강제하지 않는다)', () => {
    renderDetail(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: null }))

    expect(screen.getByText(/태그 ID가 등록되지 않았습니다/)).toBeInTheDocument()
  })

  it('🔴 QR 지점은 내려받기 버튼을 준다 · TAG ID 행은 없다', () => {
    renderDetail(detail({ authMethod: 9, authMethodName: 'QR', qrCode: 'STSP1:6:19:1786000770:sig' }))

    expect(screen.getByRole('button', { name: /QR 코드 내려받기/ })).toBeInTheDocument()
    expect(screen.queryByText('TAG ID')).not.toBeInTheDocument()
  })

  it('🔴🔴 QR 내용을 화면에 노출하지 않는다 — 화면을 찍어 현장 밖에서 인증할 수 있다 (029)', () => {
    renderDetail(detail({ authMethod: 9, authMethodName: 'QR', qrCode: 'STSP1:6:19:1786000770:sig' }))

    expect(screen.queryByText('STSP1:6:19:1786000770:sig')).not.toBeInTheDocument()
    expect(screen.getByText(/보안상 화면에는 표시하지 않습니다/)).toBeInTheDocument()
  })

  it('🔴 `qrCode` 가 비면 "준비 중" 이 아니라 **이상 상태**다 (spec 029)', () => {
    renderDetail(detail({ authMethod: 9, authMethodName: 'QR', qrCode: null }))

    expect(screen.getByText('QR 코드가 발급되지 않았습니다.')).toBeInTheDocument()
  })

  it('🔴 미실측 인증수단 코드면 안내 문구를 보여준다', () => {
    renderDetail(detail({ authMethod: 99, authMethodName: '' }))

    expect(screen.getByText('인증수단 정보를 확인할 수 없습니다.')).toBeInTheDocument()
  })
})
