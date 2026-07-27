import AppTable from '@/components/AppTable'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Worker } from '../../types/worker'
import { workerColumns } from '../WorkerColumns'

const baseWorker: Worker = {
  id: 'w-01',
  name: '김민준',
  phone: '010-2345-6789',
  role: 'WORKER',
  locationName: '강동 테크노타워',
  isAssignedElsewhere: false,
  workStatus: 'WORKING',
  status: 'ACTIVE',
  registeredAt: '2025-09-12',
  assignmentHistory: [],
}

const deployedWorker: Worker = {
  ...baseWorker,
  id: 'w-03',
  name: '오준혁',
  isAssignedElsewhere: true,
  currentAssignedLocation: { id: 'loc-gangseo', name: '강서 스퀘어타워' },
}

describe('workerColumns', () => {
  it('배치중이 아닌 근무자는 소속 사업장만 표시하고 배치중 뱃지 없음', () => {
    render(<AppTable columns={workerColumns} data={[baseWorker]} />)
    expect(screen.getByText('강동 테크노타워')).toBeInTheDocument()
    expect(screen.queryByText('배치중')).not.toBeInTheDocument()
  })

  it('배치중인 근무자는 현재 배치지 + 배치중 뱃지 표시', () => {
    render(<AppTable columns={workerColumns} data={[deployedWorker]} />)
    expect(screen.getByText('강서 스퀘어타워')).toBeInTheDocument()
    expect(screen.getByText('배치중')).toBeInTheDocument()
  })

  it('근무 상태·사용자 상태 라벨 렌더', () => {
    render(<AppTable columns={workerColumns} data={[baseWorker]} />)
    expect(screen.getByText('근무 중')).toBeInTheDocument()
    expect(screen.getByText('활성')).toBeInTheDocument()
  })
})
