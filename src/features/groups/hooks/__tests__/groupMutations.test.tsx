import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { getGroupAdminList } from '../../api/getGroupAdminList'
import { findGroup } from '../../lib/groupTree'
import { useAddGroup, useDeleteGroup, useRenameGroup } from '../useGroupMutations'
import { useGroupTree } from '../useGroupTree'

/**
 * 관리그룹 훅 + 상태 보유 MSW (`spec 043` T741).
 *
 * 시드 = 실서버 트리(실측 2026-10-22): 1 에스텍시스템 ─ 2 테스트사업장(수정) ─ 3 강동지사 / 4 test / 6 테스트그룹.
 * 할당: g2 = [3, 4] · g6 = [1, 3, 4].
 * 사업장은 지사에만 있다 — 회사·본부 사업장은 `본부할당 사업장` 지사(7 · 8 · 9 · 11, 10 = 본사 직할 본부)로 옮긴 mock 시드.
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

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
})

afterEach(() => server.events.removeAllListeners())

/** 트리 훅과 변경 훅을 **같은 QueryClient** 에 올려 무효화 → 재조회까지 본다 */
const setup = <T,>(useMutationHook: () => T) => {
  const { result } = renderHook(() => ({ tree: useGroupTree(), mutation: useMutationHook() }), {
    wrapper: makeWrapper(),
  })
  return result
}

const treeOf = async (result: { current: { tree: { data?: GroupNode } } }) => {
  await waitFor(() => expect(result.current.tree.data).toBeDefined())
  return result.current.tree.data as GroupNode
}

const capturePuts = () => {
  const bodies: unknown[] = []
  server.events.on('request:start', async ({ request }) => {
    if (new URL(request.url).pathname === UPDATE_PATH) bodies.push(await request.clone().json())
  })
  return bodies
}

describe('조회', () => {
  it('트리 출처는 AdminSiteSelect — 루트 1개 · 3단계', async () => {
    const result = setup(() => null)
    const tree = await treeOf(result)
    expect(tree.groupSeq).toBe(1)
    expect(findGroup(tree, 3)).toMatchObject({ groupName: '강동지사', layer: 2 })
  })
})

describe('추가', () => {
  it('추가 → 바디에 parentGroupSeq · userSeq: [] → 트리에 나타난다', async () => {
    const result = setup(useAddGroup)
    const parent = findGroup(await treeOf(result), 6)!

    await act(() => result.current.mutation.mutateAsync({ parent, groupName: '신규지사' }))

    await waitFor(() =>
      expect(findGroup(result.current.tree.data!, 6)!.children.map((g) => g.groupName)).toEqual([
        '본부할당 사업장',
        '신규지사',
      ])
    )
  })

  it('같은 부모 아래 같은 이름 → 409 서버 문구', async () => {
    const result = setup(useAddGroup)
    const parent = findGroup(await treeOf(result), 2)!

    await expect(
      act(() => result.current.mutation.mutateAsync({ parent, groupName: '강동지사' }))
    ).rejects.toThrow('동일한 위치에 같은 이름의 관리그룹이 이미 존재합니다.')
  })
})

describe('🔴 이름 변경 — 할당 보존(B-50)', () => {
  it('현재 할당 userSeq 를 실어 보낸다 · 할당이 그대로 남는다', async () => {
    const bodies = capturePuts()
    const result = setup(useRenameGroup)
    const group = findGroup(await treeOf(result), 2)!

    await act(() => result.current.mutation.mutateAsync({ group, groupName: '서울본부' }))

    expect(bodies).toEqual([
      { groupSeq: 2, parentGroupSeq: 1, groupName: '서울본부', userSeq: [3, 4] },
    ])
    const after = await getGroupAdminList(2)
    expect(after.filter((row) => row.isInclude).map((row) => row.userSeq)).toEqual([3, 4])
    await waitFor(() => expect(findGroup(result.current.tree.data!, 2)!.groupName).toBe('서울본부'))
  })

  it('🔴 할당 조회가 실패하면 PUT 을 보내지 않는다', async () => {
    const bodies = capturePuts()
    server.use(http.get(ADMIN_LIST_PATH, () => new HttpResponse(null, { status: 500 })))
    const result = setup(useRenameGroup)
    const group = findGroup(await treeOf(result), 2)!

    await expect(
      act(() => result.current.mutation.mutateAsync({ group, groupName: '서울본부' }))
    ).rejects.toThrow()
    expect(bodies).toEqual([])
  })
})

describe('🔴 삭제 — 연쇄(B-51)', () => {
  it('자손 그룹까지 트리에서 사라진다', async () => {
    const result = setup(useDeleteGroup)
    const group = findGroup(await treeOf(result), 2)!

    await act(() => result.current.mutation.mutateAsync(group))

    await waitFor(() => expect(findGroup(result.current.tree.data!, 2)).toBeNull())
    expect(findGroup(result.current.tree.data!, 3)).toBeNull()
    expect(findGroup(result.current.tree.data!, 4)).not.toBeNull()
  })

  it('이미 없는 그룹 → 400 서버 문구', async () => {
    const result = setup(useDeleteGroup)
    const group = findGroup(await treeOf(result), 2)!
    await act(() => result.current.mutation.mutateAsync(group))

    await expect(act(() => result.current.mutation.mutateAsync(group))).rejects.toThrow(
      '관리그룹이 존재하지 않습니다.'
    )
  })
})
