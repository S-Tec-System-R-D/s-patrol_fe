import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import type { DeploymentRequestRow } from '../../types/deployment'
import RejectRequestForm from '../RejectRequestForm'

/**
 * 거부 사유 폼 (`spec 039` T647) — store 에서 `useRejectDeployment`(MSW)로 옮겼다.
 * 🔴 성공해야 `onSuccess`(= 모달 닫기)를 부른다.
 */

const REJECT_PATH = '/api/v1/Deployment/W/sign/RejectDeploymentRequest'

const request: DeploymentRequestRow = {
  requestSeq: 502,
  userSeq: 202,
  userName: '배수진',
  fromSiteSeq: 22,
  fromSiteName: '송도 비즈니스타워',
  toSiteSeq: 7,
  toSiteName: '강동 테크노타워',
  startDt: '2026-06-03T00:00:00',
  endDt: null,
  reason: '휴가 대체',
  requestDt: '2026-05-28T15:05:00',
}

const renderForm = (onSuccess = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RejectRequestForm request={request} siteSeq={7} onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  return onSuccess
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetDeploymentStore()
})

describe('RejectRequestForm', () => {
  it('거부 사유 미입력 시 zod 에러 노출', async () => {
    const user = userEvent.setup()
    const onSuccess = renderForm()

    await user.click(screen.getByRole('button', { name: '거부' }))

    expect(await screen.findByText('거부 사유를 입력해주세요.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('🔴 공백만 입력하면 사유가 아니다 (트림 후 필수)', async () => {
    const user = userEvent.setup()
    const onSuccess = renderForm()

    await user.type(screen.getByLabelText(/거부 사유/), '   ')
    await user.click(screen.getByRole('button', { name: '거부' }))

    expect(await screen.findByText('거부 사유를 입력해주세요.')).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('서버가 받아들이면 onSuccess 를 부른다', async () => {
    const user = userEvent.setup()
    const onSuccess = renderForm()

    await user.type(screen.getByLabelText(/거부 사유/), '인원 충분')
    await user.click(screen.getByRole('button', { name: '거부' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('🔴 실패하면 onSuccess 를 부르지 않는다 — 모달·입력이 남는다', async () => {
    server.use(http.post(REJECT_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    const user = userEvent.setup()
    const onSuccess = renderForm()

    await user.type(screen.getByLabelText(/거부 사유/), '인원 충분')
    await user.click(screen.getByRole('button', { name: '거부' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '거부' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/거부 사유/)).toHaveValue('인원 충분')
  })
})
