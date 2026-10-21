import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import api from '@/lib/axios'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { makeAccessToken } from '@/test/jwt'

import { toHistoryParams, toRequestListParams } from '../../lib/deploymentParams'
import { useDeploymentHistory } from '../useDeploymentHistory'
import { useDeploymentRequests } from '../useDeploymentRequests'
import { useDeploymentSummary } from '../useDeploymentSummary'

/**
 * 배치 조회 훅 3종 + 상태 보유 MSW (`spec 039` Phase 2 게이트, T635).
 *
 * 🔴 **승인·거부가 상태를 실제로 바꾸는지**를 여기서 본다 — 화면 테스트(T646)가 그 위에서 돈다.
 * 시드(사업장 7): 대기 2 · 전출 2(배치 중 1) · 전입 2(배치 중 1) → 요약 나간 1 · 온 1 · 대기 2.
 */

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  // 🔴 T633 규약 — 상태를 바꾸는 테스트 파일은 매번 되돌린다
  resetDeploymentStore()
})

const summary = async () => {
  const { result } = renderHook(() => useDeploymentSummary(7), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return result.current.data!
}

const historyOf = async (tab: 'out' | 'in') => {
  const { result } = renderHook(() => useDeploymentHistory(toHistoryParams(7, tab)), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return result.current.data!
}

const requestsOf = async () => {
  const { result } = renderHook(() => useDeploymentRequests(toRequestListParams(7)), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return result.current.data!
}

describe('조회 3종', () => {
  it('요약은 store 에서 계산된다 — 나간 1 · 온 1 · 대기 2', async () => {
    expect(await summary()).toEqual({ outCount: 1, inCount: 1, pendingCount: 2 })
  })

  it('요청 목록은 이 사업장으로 들어온 대기 요청이다', async () => {
    const data = await requestsOf()
    expect(data.totalCount).toBe(2)
    expect(data.items.every((row) => row.toSiteSeq === 7)).toBe(true)
  })

  it('🔴 direction 으로 전출·전입이 갈린다', async () => {
    const out = await historyOf('out')
    const inn = await historyOf('in')
    expect(out.items.every((row) => row.fromSiteSeq === 7)).toBe(true)
    expect(inn.items.every((row) => row.toSiteSeq === 7)).toBe(true)
    // 근무자 mock(038)의 오준혁(원소속 강서)은 **전입**이다 — 두 mock 이 같은 말을 한다
    expect(inn.items.map((row) => row.userName)).toContain('오준혁')
    expect(out.items.map((row) => row.userName)).not.toContain('오준혁')
  })

  it('사업장이 없으면 요청하지 않는다', () => {
    const { result } = renderHook(() => useDeploymentSummary(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('🔴 상태 보유 MSW — 승인·거부가 숫자를 바꾼다', () => {
  it('승인하면 요청이 사라지고 전입 이력 1건 · 요약 대기 -1 · 온 +1', async () => {
    // 🔴 배수진(502) = 시작일이 지난 배치 → 승인하면 바로 배치중(T656). 배치예정은 현재 인원이 아니다
    await api.post('/api/v1/Deployment/W/sign/ApproveDeploymentRequest', { requestSeq: 502 })

    expect(await summary()).toEqual({ outCount: 1, inCount: 2, pendingCount: 1 })
    expect((await requestsOf()).items.map((row) => row.requestSeq)).toEqual([501])
    const approved = (await historyOf('in')).items.find((row) => row.userName === '배수진')
    // 기간은 요청의 시작일·종료일 그대로(종료일 미입력 → 미정)
    expect(approved).toMatchObject({ startDt: '2026-06-03T00:00:00', endDt: null, statusName: '배치중' })
  })

  it('거부하면 요청만 사라지고 이력은 그대로다', async () => {
    const before = (await historyOf('in')).totalCount
    await api.post('/api/v1/Deployment/W/sign/RejectDeploymentRequest', {
      requestSeq: 501,
      rejectReason: '인원 충분',
    })

    expect((await summary()).pendingCount).toBe(1)
    expect((await historyOf('in')).totalCount).toBe(before)
  })

  it('🔴 복귀일을 지정하면 기간이 바뀌고, 지난 날이면 복귀완료가 되어 현재 인원에서 빠진다 (T656)', async () => {
    await api.post('/api/v1/Deployment/W/sign/UpdateDeploymentEndDate', {
      historySeq: 603,
      endDt: '2026-01-20',
    })

    const row = (await historyOf('in')).items.find((item) => item.historySeq === 603)
    expect(row).toMatchObject({ endDt: '2026-01-20T00:00:00', statusName: '복귀완료' })
    expect((await summary()).inCount).toBe(0)
  })

  it('복귀일이 시작일보다 앞서면 400 이다 (가정)', async () => {
    await expect(
      api.post('/api/v1/Deployment/W/sign/UpdateDeploymentEndDate', {
        historySeq: 603,
        endDt: '2026-01-01',
      })
    ).rejects.toBeTruthy()
  })

  it('이미 처리된 요청을 다시 처리하면 400 이다 (가정)', async () => {
    await api.post('/api/v1/Deployment/W/sign/ApproveDeploymentRequest', { requestSeq: 501 })
    await expect(
      api.post('/api/v1/Deployment/W/sign/ApproveDeploymentRequest', { requestSeq: 501 })
    ).rejects.toBeTruthy()
  })

  it('거부 사유가 공백이면 400 이다 (가정)', async () => {
    await expect(
      api.post('/api/v1/Deployment/W/sign/RejectDeploymentRequest', {
        requestSeq: 502,
        rejectReason: '   ',
      })
    ).rejects.toBeTruthy()
  })
})
