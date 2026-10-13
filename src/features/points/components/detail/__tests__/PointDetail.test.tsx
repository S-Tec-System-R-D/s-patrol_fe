import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import PointDetail, { PointCourseList, PointCredentialCard } from '../PointDetail'
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

/** `spec 029` — 소속 코스가 기본정보에서 떨어져 나와 **좌측 열**로 갔다 */
const renderCourseList = (point = detail()) =>
  render(
    <MemoryRouter>
      <PointCourseList point={point} />
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

  it('🔴 기본정보 카드는 **기본정보만** 담는다 — 소속 코스는 좌측 열로 갔다 (spec 029)', () => {
    renderDetail()

    expect(screen.getByText('기본정보')).toBeInTheDocument()
    // 기본정보·자격증명은 "이 지점이 무엇인가", 소속 코스·순찰 기록은 "시간이 쌓이는 것"
    expect(screen.queryByText('소속 코스')).not.toBeInTheDocument()
  })

  it('🔴 placeholder 4개를 치우고 **좌표**를 넣었다 (spec 029)', () => {
    renderDetail()

    for (const label of ['지점명', '사업장', '좌표', '설명', '인증수단']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // 지점 코드·등록·최근 수정은 뺐다 — 서버에 없고 쓰임도 없다(B-19 철회)
    for (const gone of ['지점 코드', '상세 위치', '등록', '최근 수정']) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument()
    }
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('🔴 좌표가 없으면 `-` 다 — 위도만 있는 좌표는 지도에 찍을 수 없다 (spec 029)', () => {
    renderDetail(detail({ gpsLat: null, gpsLng: null, memo: '정문 CCTV 앞' }))

    // 🔴 라벨에서 행을 찾아 **그 행의 값**을 본다 — 화면에 `-` 는 여럿 있을 수 있다
    expect(screen.getByText('좌표').parentElement).toHaveTextContent('-')
    expect(screen.queryByText(/\d+\.\d{4}/)).not.toBeInTheDocument()
  })

  it('🔴 소속 코스는 코스 상세로 가는 링크다 — 활성여부 점을 대신한다 (T371)', () => {
    renderCourseList()

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
    renderCourseList(detail({ courseList: [] }))

    expect(screen.getByText(/소속된 코스가 없습니다/)).toBeInTheDocument()
    // 🔴 빈 상태는 **지금 무엇이 없는지**만 말한다 (사용자 결정 2026-10-13)
    expect(screen.queryByText(/인증 기록이 쌓이기/)).not.toBeInTheDocument()
  })
})

describe('PointCredentialCard — 인증수단별 분기', () => {
  /**
   * 🔴 `spec 029` 부터 이 카드가 **인증수단 전환 스위치**를 품는다 — mutation 훅을 쓰므로
   * `QueryClientProvider` 가 필요하다(029 전에는 순수 표시 컴포넌트였다).
   */
  const renderCard = (point = detail()) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <PointCredentialCard point={point} />
      </QueryClientProvider>
    )
  }

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

  it('🔴 QR 지점은 **내려받기 버튼**을 준다 — placeholder 가 아니다 (spec 029)', () => {
    // 027 은 "발행 메타가 없다"(B-23)를 근거로 비워 뒀는데, **식별자는 있었다**
    // (`DetailPoint.qrCode`, 실측 2026-10-13). 없는 것은 발행일·버전뿐이다.
    renderCard(detail({ authMethod: 9, authMethodName: 'QR', qrCode: 'STSP1:6:19:1786000770:sig' }))

    expect(screen.getByText('QR 코드')).toBeInTheDocument()
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /QR 코드 내려받기/ })).toBeInTheDocument()
  })

  it('🔴🔴 QR 내용을 화면에 노출하지 않는다 — 화면을 찍어 현장 밖에서 인증할 수 있다', () => {
    // 사용자 결정 2026-10-13. 이미지도, **식별자 문자열도** 보여주지 않는다 —
    // 그 문자열이 곧 QR 의 내용이라 원문을 적으면 숨긴 의미가 없다
    renderCard(detail({ authMethod: 9, authMethodName: 'QR', qrCode: 'STSP1:6:19:1786000770:sig' }))

    expect(screen.queryByText('STSP1:6:19:1786000770:sig')).not.toBeInTheDocument()
    expect(screen.getByText(/보안상 화면에는 표시하지 않습니다/)).toBeInTheDocument()
  })

  it('🔴 `qrCode` 가 비면 "준비 중" 이 아니라 **이상 상태**다 (spec 029)', () => {
    // 생성 시 서버가 자동 발급한다(실측) — 비어 있다면 기능이 없는 게 아니라
    // 그 지점이 **현장에서 인증되지 않는다**는 뜻이다
    renderCard(detail({ authMethod: 9, authMethodName: 'QR', qrCode: null }))

    expect(screen.getByText('QR 코드가 발급되지 않았습니다.')).toBeInTheDocument()
    expect(screen.getByText(/현장에서 인증할 수 없습니다/)).toBeInTheDocument()
  })

  it('🔴 재발행 버튼을 만들지 않았다 — reissueQrYn 이 동작하지 않는다 (B-37)', () => {
    renderCard(detail({ authMethod: 9, authMethodName: 'QR', qrCode: 'STSP1:6:19:1:sig' }))

    // 누르면 성공 토스트가 뜨는데 코드는 그대로인, 가장 나쁜 종류의 버튼이 된다
    expect(screen.queryByRole('button', { name: /재발행/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /다운로드|인쇄/ })).not.toBeInTheDocument()
  })

  it('🔴 미실측 인증수단 코드면 안내 문구를 보여준다', () => {
    renderCard(detail({ authMethod: 99, authMethodName: '' }))

    expect(screen.getByText('인증수단 정보를 확인할 수 없습니다.')).toBeInTheDocument()
  })
})
