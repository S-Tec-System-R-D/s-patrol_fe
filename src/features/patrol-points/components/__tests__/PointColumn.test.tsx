import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AppTable from '@/components/AppTable'
import { pointColumns } from '../PointColumn'
import type { PointPatrolType } from '@/pages/service/patrol/points/PatrolPointsPage'

const patrols: PointPatrolType[] = [
  {
    zoneName: 'A동 순찰코스',
    pointName: '정문 입구',
    patrolAt: new Date(2026, 4, 1, 9, 7),
    authMethod: 'QR',
    worker: '김민준',
    result: 'NORMAL',
    records: [],
  },
  {
    zoneName: 'A동 순찰코스',
    pointName: '로비 1층',
    patrolAt: new Date(2026, 4, 1, 9, 13),
    authMethod: 'QR',
    worker: '김민준',
    result: 'RECORDED',
    records: [
      { recordedAt: new Date(2026, 4, 1, 9, 13), content: '물기 발견', photoCount: 2, maxPhotoCount: 3 },
      { recordedAt: new Date(2026, 4, 1, 9, 14), content: '소화기 확인', photoCount: 1, maxPhotoCount: 3 },
    ],
  },
]

describe('pointColumns', () => {
  it('기록 0건 행 → 클릭 불가능한 회색 텍스트 "0"', () => {
    const onRecordClick = vi.fn()
    render(<AppTable columns={pointColumns(onRecordClick)} data={patrols} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument()
  })

  it('기록 N건 행 → 클릭 가능한 버튼형 뱃지, 클릭 시 onRecordClick 호출', async () => {
    const onRecordClick = vi.fn()
    render(<AppTable columns={pointColumns(onRecordClick)} data={patrols} />)
    const recordButton = screen.getByRole('button', { name: '2건' })
    expect(recordButton).toBeInTheDocument()

    await userEvent.click(recordButton)
    expect(onRecordClick).toHaveBeenCalledWith(patrols[1])
  })

  it('시간초과 결과가 아닌 미완료 행도 아니라면 시간이 표시됨', () => {
    render(<AppTable columns={pointColumns(vi.fn())} data={patrols} />)
    expect(screen.getByText('09:07')).toBeInTheDocument()
  })
})
