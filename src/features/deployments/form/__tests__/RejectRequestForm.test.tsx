import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DeploymentRequestSummary } from '../../types/deployment'
import RejectRequestForm from '../RejectRequestForm'

const request: DeploymentRequestSummary = {
  id: 'dep-req-test',
  direction: 'DEPLOY',
  workerName: '최범수',
  fromLocationName: '해운대 마린시티',
  toLocationName: '강동 그랜드타워',
  reason: '야간 인력 부족 지원',
  status: 'PENDING',
  requestedAt: '2026-05-30',
}

describe('RejectRequestForm', () => {
  it('거부 사유 미입력 시 zod 에러 노출', async () => {
    const onSuccess = vi.fn()
    render(<RejectRequestForm request={request} onSuccess={onSuccess} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '거부' }))

    expect(await screen.findByText('거부 사유를 입력해주세요.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
