import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import api from '@/lib/axios'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { toHistoryParams } from '../../lib/deploymentParams'
import { useApproveDeployment } from '../useApproveDeployment'
import { useDeploymentHistory } from '../useDeploymentHistory'
import { useDeploymentRequests } from '../useDeploymentRequests'
import { useDeploymentSummary } from '../useDeploymentSummary'
import { useReturnRequests } from '../useReturnRequests'
import { useUserAssignmentHistory } from '../useUserAssignmentHistory'

/**
 * 배치 조회·처리 훅 + 상태 보유 MSW (`spec 039` T635 → `spec 042` T708 실측 API).
 *
 * 🔴 **승인·반려가 상태를 실제로 바꾸는지**와 **바디에 `approved` 가 항상 실리는지**를 여기서 본다.
 * 시드(사업장 7): 배치 대기 2(최범수 501 · 배수진 502) · 복귀 대기 1(장도윤 601) ·
 * 전출 2(장도윤 배치중 · 박지우 복귀완료) · 전입 2(오준혁 배치중 · 한지민 복귀완료) → 요약 나간 1 · 온 1 · 대기 2.
 */

const APPROVE_PATH = '/api/v1/Assignment/W/sign/AssignmentApprove'
const RETURN_APPROVE_PATH = '/api/v1/Assignment/W/sign/AssignmentReturnApprove'

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  // 🔴 상태를 바꾸는 테스트 파일은 매번 되돌린다
  resetDeploymentStore()
})

const settle = async <T,>(hook: () => { isSuccess: boolean; data?: T }) => {
  const { result } = renderHook(hook, { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return result.current.data as T
}

const summary = () => settle(() => useDeploymentSummary(7))
const requests = () => settle(() => useDeploymentRequests(7))
const returns = () => settle(() => useReturnRequests(7))
const historyOf = (tab: 'in' | 'out') => settle(() => useDeploymentHistory(tab, toHistoryParams(7)))

describe('조회', () => {
  it('요약 — 나간 1 · 온 1 · 대기 2 (복귀 대기 건수는 없다)', async () => {
    expect(await summary()).toEqual({ outCount: 1, inCount: 1, pendingCount: 2 })
  })

  it('🔴 요청 목록 2종은 배열이고 근무자가 있다', async () => {
    const rows = await requests()
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.map((row) => row.userName)).toEqual(['최범수', '배수진'])
    // 복귀 요청 행은 원래 배치 방향 그대로다(7 → 12)
    expect(await returns()).toMatchObject([
      { assignmentSeq: 601, userName: '장도윤', fromSiteSeq: 7, toSiteSeq: 12 },
    ])
  })

  it('🔴 전입·전출이 각 엔드포인트로 갈리고 행 모양이 다르다', async () => {
    const inn = await historyOf('in')
    const out = await historyOf('out')
    expect(inn.items.map((row) => row.userName)).toEqual(['한지민', '오준혁'])
    expect(inn.items[0]).toHaveProperty('fromSiteName')
    expect(out.items.map((row) => row.userName)).toEqual(['박지우', '장도윤'])
    expect(out.items[0]).toHaveProperty('toSiteName')
    expect(out.items.map((row) => row.statusName)).toEqual(['복귀완료', '배치중'])
  })

  it('근무자별 이력은 그 사람의 승인된 배치다', async () => {
    const data = await settle(() =>
      useUserAssignmentHistory({ userSeq: 110, pageNumber: 1, pageSize: 5 })
    )
    expect(data.items).toMatchObject([{ assignmentSeq: 601, siteName: '강서 스퀘어타워' }])
  })

  it('사업장이 없으면 요청하지 않는다', () => {
    const { result } = renderHook(() => useDeploymentRequests(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('🔴 처리 — 바디에 approved 가 항상 실린다 (B-48)', () => {
  const captureBodies = (path: string) => {
    const bodies: unknown[] = []
    server.events.on('request:start', async ({ request }) => {
      if (new URL(request.url).pathname === path) bodies.push(await request.clone().json())
    })
    return bodies
  }

  it('배치 반려는 approved: false 로 나간다', async () => {
    const bodies = captureBodies(APPROVE_PATH)
    const { result } = renderHook(() => useApproveDeployment(7), { wrapper })

    await result.current.mutateAsync({ assignmentSeq: 501, userName: '최범수', approved: false })

    expect(bodies).toEqual([{ assignmentSeq: 501, approved: false }])
    server.events.removeAllListeners()
  })

  it('복귀 승인은 복귀 경로 + approved: true 로 나간다', async () => {
    const bodies = captureBodies(RETURN_APPROVE_PATH)
    const { result } = renderHook(() => useApproveDeployment(7, 'return'), { wrapper })

    await result.current.mutateAsync({ assignmentSeq: 601, userName: '장도윤', approved: true })

    expect(bodies).toEqual([{ assignmentSeq: 601, approved: true }])
    server.events.removeAllListeners()
  })
})

describe('🔴 상태 보유 MSW — 승인·반려가 숫자를 바꾼다', () => {
  it('승인하면 요청이 사라지고 전입 이력 1건 · 요약 대기 -1 · 온 +1', async () => {
    await api.put(APPROVE_PATH, { assignmentSeq: 502, approved: true })

    expect(await summary()).toEqual({ outCount: 1, inCount: 2, pendingCount: 1 })
    expect((await requests()).map((row) => row.assignmentSeq)).toEqual([501])
    const approved = (await historyOf('in')).items.find((row) => row.userName === '배수진')
    // 기간은 요청의 시작일·종료일 그대로(종료일 미입력 → null)
    expect(approved).toMatchObject({
      startDt: '2026-06-03T00:00:00',
      endDt: null,
      statusName: '배치중',
    })
  })

  it('반려하면 요청만 사라지고 이력은 그대로다', async () => {
    const before = (await historyOf('in')).totalCount
    await api.put(APPROVE_PATH, { assignmentSeq: 501, approved: false })

    expect((await summary()).pendingCount).toBe(1)
    expect((await historyOf('in')).totalCount).toBe(before)
  })

  it('🔴 복귀 요청을 승인하면 복귀완료 · 나간 인원 -1 · 복귀 목록이 빈다', async () => {
    await api.put(RETURN_APPROVE_PATH, { assignmentSeq: 601, approved: true })

    const row = (await historyOf('out')).items.find((item) => item.assignmentSeq === 601)
    expect(row?.statusName).toBe('복귀완료')
    expect(row?.endDt).toBeNull()
    expect(await returns()).toEqual([])
    expect(await summary()).toEqual({ outCount: 0, inCount: 1, pendingCount: 2 })
  })

  it('복귀 요청을 반려하면 요청만 사라지고 배치는 그대로다', async () => {
    await api.put(RETURN_APPROVE_PATH, { assignmentSeq: 601, approved: false })

    expect(await returns()).toEqual([])
    const row = (await historyOf('out')).items.find((item) => item.assignmentSeq === 601)
    expect(row?.statusName).toBe('배치중')
  })

  it('이미 처리된 배치를 다시 처리하면 400 · 없는 배치는 404 (실측 문구)', async () => {
    await api.put(APPROVE_PATH, { assignmentSeq: 501, approved: true })
    await expect(api.put(APPROVE_PATH, { assignmentSeq: 501, approved: true })).rejects.toThrow(
      '이미 승인 또는 반려 처리된 배치입니다.'
    )
    await expect(api.put(APPROVE_PATH, { assignmentSeq: 9999, approved: true })).rejects.toThrow(
      '배치 정보를 찾을 수 없습니다.'
    )
  })
})
