import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import { getGroupAdminList } from '@/features/groups/api/getGroupAdminList'
import { useGroupTree } from '@/features/groups/hooks/useGroupTree'
import { findGroup } from '@/features/groups/lib/groupTree'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import { useAddAdminGroups, useRemoveAdminGroup } from '../useAdminGroupMutations'

/**
 * 담당 그룹 추가 · 해제 훅 (`spec 045` T835) — 실패 경로. 정상 경로(순서 · 바디)는 `AdminsPage.test.tsx`.
 * 시드 할당: g2 = [3, 4] · g3 = [] · g4 = [3, 12].
 */

const UPDATE_PATH = '/api/v1/Group/W/sign/UpdateGroup'
const ADMIN_LIST_PATH = '/api/v1/Group/W/sign/GetGroupAdminList'

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

const countPuts = () => {
  const puts: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname === UPDATE_PATH) puts.push(request.method)
  })
  return puts
}

const assignedTo = async (groupSeq: number) =>
  (await getGroupAdminList(groupSeq)).filter((row) => row.isInclude).map((row) => row.userSeq)

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
})

afterEach(() => server.events.removeAllListeners())

describe('useAddAdminGroups — 실패 경로', () => {
  it('🔴 PUT 직전 읽기가 실패하면 그 PUT 을 보내지 않는다(빈 배열로 보내면 할당이 지워진다)', async () => {
    const puts = countPuts()
    server.use(
      http.get(ADMIN_LIST_PATH, () => HttpResponse.json({ message: '오류', data: null, code: 500 }, { status: 500 }))
    )
    const result = setup()
    const [g2] = await groupsOf(result, [2])

    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 6, groups: [g2] }).catch(() => {})
    })
    expect(puts).toEqual([])
  })

  it('🔴 첫 실패에서 멈춘다 — 뒤 그룹은 보내지 않는다', async () => {
    const puts = countPuts()
    server.use(
      http.put(UPDATE_PATH, async ({ request }) => {
        const body = (await request.clone().json()) as { groupSeq: number }
        return body.groupSeq === 3
          ? HttpResponse.json({ message: '관리그룹이 존재하지 않습니다.', data: false, code: 400 }, { status: 400 })
          : undefined
      })
    )
    const result = setup()
    const [g3, g4] = await groupsOf(result, [3, 4])

    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 6, groups: [g3, g4] }).catch(() => {})
    })
    expect(puts).toEqual(['PUT'])
    expect(await assignedTo(4)).toEqual([3, 12])
  })

  it('이미 맡은 사람은 중복으로 넣지 않는다', async () => {
    const result = setup()
    const [g2] = await groupsOf(result, [2])

    await act(async () => {
      await result.current.add.mutateAsync({ userSeq: 3, groups: [g2] })
    })
    expect(await assignedTo(2)).toEqual([3, 4])
  })
})

describe('useRemoveAdminGroup', () => {
  it('대상만 빼고 나머지 할당은 그대로', async () => {
    const result = setup()
    const [g4] = await groupsOf(result, [4])

    await act(async () => {
      await result.current.remove.mutateAsync({ userSeq: 3, group: g4 })
    })
    expect(await assignedTo(4)).toEqual([12])
  })

  it('🔴 회사(루트)는 요청 없이 막는다(OQ-045-A)', async () => {
    const puts = countPuts()
    const result = setup()
    const [root] = await groupsOf(result, [1])

    await act(async () => {
      await expect(result.current.remove.mutateAsync({ userSeq: 1, group: root })).rejects.toThrow(
        '최상위 그룹은 변경할 수 없습니다.'
      )
    })
    expect(puts).toEqual([])
  })
})
