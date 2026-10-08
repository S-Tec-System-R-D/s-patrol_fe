import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PointDetail from '../PointDetail'
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

const renderDetail = (point = detail()) => render(<PointDetail point={point} />)


describe('PointDetail — 레이아웃 결정(027)', () => {
  it('🔴 본문에 지점명이 없다 — 페이지 제목이 갖는다', () => {
    renderDetail()

    // 제목과 본문에 같은 값이 두 번 보이면 안 된다
    expect(screen.queryByText('정문 입구')).not.toBeInTheDocument()
    expect(screen.queryByText('이름')).not.toBeInTheDocument()
  })

  it('🔴 본문에 사용여부 행이 없다 — 페이지 제목 옆 뱃지가 갖는다', () => {
    renderDetail()

    expect(screen.queryByText('사용여부')).not.toBeInTheDocument()
    expect(screen.queryByText('미사용')).not.toBeInTheDocument()
  })

  it('🔴 생성일 행이 없다 — 서버에 createdAt 이 없다(OQ-022-I, 실측 확인)', () => {
    renderDetail()

    expect(screen.queryByText('생성일')).not.toBeInTheDocument()
    // 대신 서버가 주는 최근 순찰을 보여준다
    expect(screen.getByText('최근 순찰')).toBeInTheDocument()
  })

  it('🔴 섹션을 3개 카드로 나눈다 — 기본정보 · 인증 수단 · 소속 코스', () => {
    renderDetail()

    expect(screen.getByText('기본정보')).toBeInTheDocument()
    expect(screen.getByText('인증 수단')).toBeInTheDocument()
    expect(screen.getByText('소속 코스')).toBeInTheDocument()
  })

  it('설명이 비면 하이픈', () => {
    renderDetail(detail({ memo: null }))

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('소속 코스가 0건이면 안내를 보여준다', () => {
    renderDetail(detail({ courseList: [] }))

    expect(screen.getByText('소속된 코스가 없습니다.')).toBeInTheDocument()
  })
})
