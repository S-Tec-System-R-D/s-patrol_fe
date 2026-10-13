import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import PointDetail, { PointCredentialCard } from '../PointDetail'
import type { PointDetail as PointDetailData } from '../../../types'

/**
 * 상세 **본문**의 표시 계약 — `spec 027` Phase 2.
 *
 * 🔴 **수정·삭제 테스트는 `PointDetailPage.test.tsx` 로 옮겼다.** 027 에서 상세가 페이지가
 * 되면서 액션과 mutation 의 주인이 페이지로 갔다. 여기는 **순수 표시**만 본다 —
 * 섹션 구성·중복 제거·미실측 인증수단 처리.
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

// 소속 코스 행이 `Link` 가 되면서(T371·T372) 라우터가 필요하다
const renderDetail = (point = detail()) =>
  render(
    <MemoryRouter>
      <PointDetail point={point} />
    </MemoryRouter>
  )


describe('PointDetail — 레이아웃 결정(027)', () => {
  it('기본정보에 지점명 행이 있다 — 제목과 중복이지만 의도된 것(사용자 결정 2026-10-08)', () => {
    // 기본정보 블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다
    renderDetail()

    expect(screen.getByText('지점명')).toBeInTheDocument()
    expect(screen.getByText('정문 입구')).toBeInTheDocument()
  })

  it('🔴 인증 수단은 본문이 아니라 별도 카드다 — 페이지가 우측에 배치한다', () => {
    renderDetail()

    expect(screen.queryByText('인증 수단')).not.toBeInTheDocument()
  })

  it('🔴 본문에 사용여부 행이 없다 — 페이지 제목 옆 뱃지가 갖는다', () => {
    renderDetail()

    expect(screen.queryByText('사용여부')).not.toBeInTheDocument()
    expect(screen.queryByText('미사용')).not.toBeInTheDocument()
  })

  it('🔴 "최근 순찰" 행이 없다 — 통계 칸과 같은 값이다', () => {
    renderDetail()

    expect(screen.queryByText('최근 순찰')).not.toBeInTheDocument()
  })

  it('인증수단은 기본정보 행으로 녹였다 — 별도 섹션이 아니다', () => {
    renderDetail()

    expect(screen.getByText('인증수단')).toBeInTheDocument()
    expect(screen.queryByText('인증 수단')).not.toBeInTheDocument()
  })

  it('🔴 본문은 기본정보 · 소속 코스 2카드다', () => {
    renderDetail()

    expect(screen.getByText('기본정보')).toBeInTheDocument()
    expect(screen.getByText('소속 코스')).toBeInTheDocument()
  })

  it('🔴 기본정보는 8칸이고 그중 4칸이 placeholder 다 (B-19·B-20·B-21)', () => {
    renderDetail()

    for (const label of ['지점명', '지점 코드', '사업장', '상세 위치', '설명', '인증수단', '등록', '최근 수정']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // 점선 + "준비 중" — 빈 값(`-`)과 구별된다
    expect(screen.getAllByText('준비 중')).toHaveLength(4)
  })

  it('🔴 소속 코스는 코스 상세로 가는 링크다 — 활성여부 점을 대신한다 (T371)', () => {
    renderDetail()

    expect(screen.getByRole('link', { name: 'A동 순찰코스' })).toHaveAttribute('href', '/zones/1')
  })

  it('🔴 편성 진입 버튼을 두지 않는다 (사용자 결정 2026-10-13)', () => {
    renderDetail()

    // 여기서 바로 편성해 주지 못하는 이상(요청 3개) 버튼은 "다른 데 가서 하세요" 만
    // 말하는 자리 차지다. 코스 행 링크가 갈 길을 이미 준다
    expect(screen.queryByRole('button', { name: '코스에 추가' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /편성/ })).not.toBeInTheDocument()
  })

  it('설명이 비면 하이픈', () => {
    renderDetail(detail({ memo: null }))

    // 사업장(미선택)도 '-' 라 2개 이상이다
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('소속 코스가 0건이면 안내를 보여준다', () => {
    renderDetail(detail({ courseList: [] }))

    expect(screen.getByText(/소속된 코스가 없습니다/)).toBeInTheDocument()
    // 🔴 빈 상태는 **지금 무엇이 없는지**만 말한다 (사용자 결정 2026-10-13)
    expect(screen.queryByText(/인증 기록이 쌓이기/)).not.toBeInTheDocument()
  })
})

describe('PointCredentialCard — 인증수단별 분기', () => {
  const renderCard = (point = detail()) => render(<PointCredentialCard point={point} />)

  it('🔴 NFC 지점은 TAG ID 를 실제로 보여준다 — placeholder 가 아니다', () => {
    renderCard(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: '04A1B2C3D4E5F6' }))

    expect(screen.getByText('NFC 태그')).toBeInTheDocument()
    expect(screen.getByText('04A1B2C3D4E5F6')).toBeInTheDocument()
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('NFC 인데 TAG ID 가 없으면 등록 안내를 보여준다 (B-13 — 서버가 강제하지 않는다)', () => {
    renderCard(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: null }))

    expect(screen.getByText(/태그 ID가 등록되지 않았습니다/)).toBeInTheDocument()
  })

  it('QR 지점은 placeholder 다 — 발행 메타가 없고(B-23) 생성은 별도 작업(OQ-022-D)', () => {
    renderCard(detail({ authMethod: 9, authMethodName: 'QR' }))

    expect(screen.getByText('QR 코드')).toBeInTheDocument()
    expect(screen.getByText('준비 중')).toBeInTheDocument()
  })

  it('🔴 미실측 인증수단 코드면 안내 문구를 보여준다', () => {
    renderCard(detail({ authMethod: 99, authMethodName: '' }))

    expect(screen.getByText('인증수단 정보를 확인할 수 없습니다.')).toBeInTheDocument()
  })
})
