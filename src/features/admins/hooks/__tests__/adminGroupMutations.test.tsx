import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import { useGroupTree } from '@/features/groups/hooks/useGroupTree'
import { findGroup } from '@/features/groups/lib/groupTree'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import { getAdminDetail } from '../../api/getAdminDetail'
import { useAddAdminGroups, useRemoveAdminGroup } from '../useAdminGroupMutations'

/**
 * 매니저 담당 그룹 추가 · 해제 훅 (`spec 045` T835 → `spec 056` T1004 — `GetAdminDetail` → `UpdateAdmin.groupSeq`).
 * 시드: 매니저 6 = 강동지사(g3).
 */

const UPDATE_PATH = '/api/v1/AdminUser/W/sign/UpdateAdmin'
const DETAIL_PATH = '/api/v1/AdminUser/W/sign/GetAdminDetail'

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const setup = () => {
  const { result } = renderHook(
    () => ({ tree: useGroupTree(), add: useAddAdminGroups(), remove: useRemoveAdminGroup() }),
    { wrapper: makeWrapper() }
  )
  return result
}

const groupsOf = async (result: ReturnType<typeof setup>, seqs: number[]) => {
  await waitFor(() => expect(result.current.tree.data).toBeDefined())
  const root = result.current.tree.data as GroupNode
  return seqs.map((seq) => findGroup(root, seq) as GroupNode)
}

/** 요청 순서 — 경로 마지막 조각 */
const recordRequests = () => {
  const calls: string[] = []
  server.events.on('request:start', ({ request }) => {
    const path = new URL(request.url).pathname
    if (path === UPDATE_PATH || path === DETAIL_PATH) calls.push(path.split('/').pop() ?? '')
  })
  return calls
}

const groupsOfAdmin = async (userSeq: number) => (await getAdminDetail(userSeq)).groupSeq

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
})

afterEach(() => server.events.removeAllListeners())

describe('useAddAdminGroups', () => {
  it('🔴 PUT 직전에 현재 할당을 다시 읽고, 여러 그룹도 요청 1번(현재 ∪ 고른 것)', async () => {
    const calls = recordRequests()
    const result = setup()
    const [g4, g2] = await groupsOf(result, [4, 2])

    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 6, groups: [g4, g2] })
    })
    expect(calls).toEqual(['GetAdminDetail', 'UpdateAdmin'])
    expect(await groupsOfAdmin(6)).toEqual([2, 3, 4])
  })

  it('🔴 읽기가 실패하면 PUT 을 보내지 않는다(캐시로 보내면 그 사이 바뀐 할당을 지운다)', async () => {
    const calls = recordRequests()
    server.use(
      http.get(DETAIL_PATH, () => HttpResponse.json({ message: '오류', data: null, code: 500 }, { status: 500 }))
    )
    const result = setup()
    const [g4] = await groupsOf(result, [4])

    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 6, groups: [g4] }).catch(() => {})
    })
    expect(calls).toEqual(['GetAdminDetail'])
  })

  it('이미 맡은 그룹은 중복으로 넣지 않는다', async () => {
    const result = setup()
    const [g3] = await groupsOf(result, [3])

    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 6, groups: [g3] })
    })
    expect(await groupsOfAdmin(6)).toEqual([3])
  })
})

describe('useRemoveAdminGroup', () => {
  it('대상만 빼고 나머지 할당은 그대로', async () => {
    const result = setup()
    const [g2, g3] = await groupsOf(result, [2, 3])
    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 6, groups: [g2] })
    })

    await act(async () => {
      await result.current.remove.mutateAsync({ userSeq: 6, group: g3 })
    })
    expect(await groupsOfAdmin(6)).toEqual([2])
  })
})
