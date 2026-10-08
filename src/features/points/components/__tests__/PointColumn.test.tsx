import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AppTable from '@/components/AppTable'
import { pointColumns } from '../PointColumn'
import type { PointRow } from '../../types'

/**
 * `spec 027` Phase 1 — `PointListCard.test.tsx` **11건의 이설처**.
 *
 * 🔴 **테스트를 버리지 않고 옮겼다.** 좌측 카드가 전체 폭 테이블 컬럼으로 바뀌었을 뿐,
 * 022 가 고정한 계약 3개는 **그대로 유효하다**(`tasks.md` 제약 2):
 * 1. 미사용(`useYn: false`) 지점 구분 — 서버가 목록에서 제외하지 않는다(실측)
 * 2. 표시할 라벨이 없으면 인증수단 뱃지를 숨긴다 — 없는 이름을 만들지 않는다(A1)
 * 3. `authMethodName` 이 비어도 매핑표로 폴백한다(B-6)
 *
 * 카드 고유였던 것(번호 뱃지 강조·`selected` prop)은 **선택 개념이 사라져** 따라오지
 * 않는다. 대신 **행 클릭이 `pointSeq` 를 넘기는지**는 유지한다 — 라우트 이동의 근거다.
 *
 * 컬럼은 `AppTable` 안에서만 의미가 있어 테이블째로 렌더한다.
 */

const row = (overrides: Partial<PointRow> = {}): PointRow => ({
  pointSeq: 1,
  pointName: '정문 입구',
  memo: '정문 CCTV 앞',
  authMethod: 9,
  authMethodName: 'QR',
  usedCount: 0,
  useYn: true,
  nfcTagId: null,
  lastPatrolDt: null,
  ...overrides,
})

const renderTable = (rows: PointRow[], onRowClick = vi.fn()) => {
  render(<AppTable columns={pointColumns()} data={rows} hidePagination onRowClick={onRowClick} />)
  return { onRowClick }
}

describe('pointColumns — 기본 렌더', () => {
  it('지점명과 QR 뱃지를 그린다', () => {
    renderTable([row()])
    expect(screen.getByText('정문 입구')).toBeInTheDocument()
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it('NFC 지점은 NFC 뱃지와 TAG ID를 그린다', () => {
    renderTable([
      row({ pointSeq: 2, pointName: '로비 1층', authMethod: 10, authMethodName: 'NFC', nfcTagId: '04A1B2C3D4E5F6' }),
    ])
    expect(screen.getByText('NFC')).toBeInTheDocument()
    expect(screen.getByText('04A1B2C3D4E5F6')).toBeInTheDocument()
  })

  it('설명·TAG ID가 비면 하이픈으로 채운다', () => {
    renderTable([row({ memo: null, nfcTagId: null })])
    expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(2)
  })

  it('최근 순찰이 없으면 "기록 없음"', () => {
    renderTable([row({ lastPatrolDt: null })])
    expect(screen.getByText('기록 없음')).toBeInTheDocument()
  })

  it('최근 순찰 날짜를 yyyy-MM-dd HH:mm 으로 그린다', () => {
    renderTable([row({ lastPatrolDt: '2026-10-02T09:11:00' })])
    expect(screen.getByText('2026-10-02 09:11')).toBeInTheDocument()
  })

  it('깨진 날짜도 터지지 않고 "기록 없음"으로 수렴한다', () => {
    renderTable([row({ lastPatrolDt: 'not-a-date' })])
    expect(screen.getByText('기록 없음')).toBeInTheDocument()
  })
})

describe('pointColumns — 022에서 이설된 계약', () => {
  it('서버 표시명이 비어도 매핑표 라벨로 뱃지를 그린다 (B-6)', () => {
    renderTable([row({ authMethodName: '' })])
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it("authMethodName이 'Unknown'이어도 매핑표로 폴백한다 (B-6 — null 표현 2종)", () => {
    renderTable([row({ authMethodName: 'Unknown' })])
    expect(screen.getByText('QR')).toBeInTheDocument()
  })

  it('🔴 미실측 코드 + 표시명 없음이면 뱃지를 숨긴다 — 없는 라벨을 만들지 않는다', () => {
    renderTable([row({ authMethod: 99, authMethodName: '' })])
    expect(screen.queryByText('QR')).not.toBeInTheDocument()
    expect(screen.queryByText('NFC')).not.toBeInTheDocument()
  })
})

describe('pointColumns — 미사용 지점 구분', () => {
  it('🔴 사용여부 뱃지로 구분한다 — 색·명도만으로 전달하지 않는다 (design-system §3)', () => {
    // 022는 340px라 톤다운 + sr-only로 때웠다. 전체 폭에서는 뱃지가 그 역할을 한다.
    renderTable([row({ useYn: false })])
    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('사용 지점은 "사용" 뱃지', () => {
    renderTable([row({ useYn: true })])
    expect(screen.getByText('사용')).toBeInTheDocument()
    expect(screen.queryByText('미사용')).not.toBeInTheDocument()
  })

  it('미사용 지점의 지점명을 톤다운한다', () => {
    renderTable([row({ useYn: false, pointName: '비상구 B' })])
    expect(screen.getByText('비상구 B')).toHaveClass('text-muted-foreground')
  })

  it('사용 지점의 지점명은 톤다운하지 않는다', () => {
    renderTable([row({ useYn: true, pointName: '정문 입구' })])
    expect(screen.getByText('정문 입구')).not.toHaveClass('text-muted-foreground')
  })
})

describe('pointColumns — 행 클릭', () => {
  it('🔴 행을 클릭하면 그 행 데이터를 넘긴다 — 라우트 이동의 근거', async () => {
    const user = userEvent.setup()
    const { onRowClick } = renderTable([row({ pointSeq: 42, pointName: '지하 주차장 B1' })])

    await user.click(screen.getByText('지하 주차장 B1'))

    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ pointSeq: 42 }))
  })
})
