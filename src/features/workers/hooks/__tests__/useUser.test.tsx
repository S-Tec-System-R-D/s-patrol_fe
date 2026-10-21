import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { makeAccessToken } from '@/test/jwt'

import { toUserListParams, type UserQuery } from '../../lib/userListParams'
import { useUserDetail } from '../useUserDetail'
import { useUserList } from '../useUserList'

/**
 * 근무자 훅 2종 + MSW 핸들러 (`spec 038` Phase 2 게이트, T605).
 *
 * 핸들러가 **서버 이름의 파라미터**(`siteId`·`searchKey`·`codeSeq`·`workYn`·`userId`)를 받아
 * 실제로 걸러 주는지 본다 — 전량 반환으로 때우면 화면 테스트가 파라미터를 검증할 수 없다.
 * 시드(`mocks/handlers/users.ts`): 사업장 7 · 9명 — 관리자 109 · 근무 종료 102·105·108 · 파견 103.
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
})

const listOf = async (query: UserQuery, siteSeq = 7) => {
  const { result } = renderHook(() => useUserList(toUserListParams(siteSeq, query)), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return result.current.data!
}

const seqs = (data: { items: { userSeq: number }[] }) => data.items.map((row) => row.userSeq)

describe('useUserList', () => {
  it('사업장 사람을 등록일 내림차순으로 받는다 — 관리자도 섞여 온다', async () => {
    const data = await listOf({})
    expect(data.totalCount).toBe(9)
    expect(seqs(data)[0]).toBe(107)
    expect(data.items.some((row) => row.codeSeq === 6)).toBe(true)
  })

  it('권한·근무 상태·검색이 서버 파라미터로 나가 걸러진다', async () => {
    expect(seqs(await listOf({ role: '6' }))).toEqual([109])
    expect(seqs(await listOf({ work: 'false' })).sort()).toEqual([102, 105, 108])
    expect(seqs(await listOf({ q: '서' }))).toEqual([107, 102])
  })

  it('🔴 검색은 이름·사번을 거르고 연락처는 거르지 않는다 (실측 2026-10-21)', async () => {
    expect(seqs(await listOf({ q: '240105' }))).toEqual([105])
    expect(seqs(await listOf({ q: '01067890123' }))).toEqual([])
  })

  it('페이징이 나간다', async () => {
    const page2 = await listOf({ page: '2', size: '4' })
    expect(page2.items).toHaveLength(4)
    expect(page2.totalCount).toBe(9)
  })

  it('다른 사업장은 비어 있다', async () => {
    expect((await listOf({}, 8)).items).toEqual([])
  })

  it('params 가 null 이면 요청하지 않는다', () => {
    const { result } = renderHook(() => useUserList(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUserDetail', () => {
  it('🔴 상세에는 권한 코드·등록일이 없다 (OQ-8) — 실서버와 같은 모양', async () => {
    const { result } = renderHook(() => useUserDetail(101), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.phone).toBe('01023456789')
    // ✅ `codeName` 은 생겼다(실측 2026-10-21, B-41 ② 일부) — `codeSeq`·`createDt` 는 아직 없다
    expect(result.current.data?.codeName).toBe('현장 근무자')
    expect(result.current.data).not.toHaveProperty('codeSeq')
    expect(result.current.data).not.toHaveProperty('createDt')
  })

  it('🔴 배치 온 사람의 상세는 소속지를 준다 (실측 2026-10-21)', async () => {
    const { result } = renderHook(() => useUserDetail(103), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.siteName).toBe('강서 스퀘어타워')
  })

  it('없는 근무자는 오류다', async () => {
    const { result } = renderHook(() => useUserDetail(999), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('userSeq 가 null 이면 요청하지 않는다', () => {
    const { result } = renderHook(() => useUserDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
