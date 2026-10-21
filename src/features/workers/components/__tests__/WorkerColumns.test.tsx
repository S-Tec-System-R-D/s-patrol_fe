import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AppTable from '@/components/AppTable'
import type { UserRow } from '../../types/user'
import { workerColumns } from '../WorkerColumns'

/**
 * 근무자 목록 컬럼 (`spec 038` T612).
 *
 * 🔴 **구 테스트 3건을 대체했다** — "배치중 뱃지" · "사용자 상태 라벨" 은 mock 타입의 필드였고
 * 서버에 근거가 없어 컬럼째 사라졌다.
 */

const row = (over: Partial<UserRow> = {}): UserRow => ({
  userSeq: 101,
  userName: '김민준',
  loginId: '240101',
  codeSeq: 7,
  codeName: '현장 근무자',
  originSiteSeq: null,
  originSiteName: '강동 테크노타워',
  workYn: true,
  createDt: '2025-09-12T09:00:00',
  ...over,
})

const renderRows = (rows: UserRow[]) => render(<AppTable columns={workerColumns()} data={rows} />)

describe('workerColumns', () => {
  it('이름·사번·권한·근무 상태·등록일을 그린다', () => {
    renderRows([row()])

    expect(screen.getByText('김민준')).toBeInTheDocument()
    expect(screen.getByText('240101')).toBeInTheDocument()
    expect(screen.getByText('현장 근무자')).toBeInTheDocument()
    expect(screen.getByText('근무 중')).toBeInTheDocument()
    expect(screen.getByText('2025-09-12')).toBeInTheDocument()
  })

  it('근무 종료를 그린다', () => {
    renderRows([row({ workYn: false })])

    expect(screen.getByText('근무 종료')).toBeInTheDocument()
  })

  it('⚠️ 원소속은 Seq 가 있을 때만 이름을 보인다 (OQ-038-B)', () => {
    renderRows([
      row(),
      row({ userSeq: 103, userName: '오준혁', originSiteSeq: 12, originSiteName: '강서 스퀘어타워' }),
    ])

    expect(screen.getByText('강서 스퀘어타워')).toBeInTheDocument()
    // Seq null 행의 이름(= 현재 사업장명)은 반복될 뿐이라 그리지 않는다
    expect(screen.queryByText('강동 테크노타워')).not.toBeInTheDocument()
  })

  it('🔴 헤더에 정렬이 없다 — 서버 페이징이다', () => {
    renderRows([row()])

    expect(screen.getByText('이름').closest('th')).not.toHaveClass('cursor-pointer')
  })
})
