import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { makeAccessToken } from '@/test/jwt'

import { toNoticeListParams } from '../../lib/noticeListParams'
import { useNoticeDetail } from '../useNoticeDetail'
import { useNoticeList } from '../useNoticeList'

/**
 * 공지 훅 2종 + MSW 핸들러 (`spec 026` Phase 2 게이트).
 *
 * 핸들러가 **키워드·기간·페이징을 실제로 걸러 주는지** 본다 — 전량 반환으로 때우면 화면
 * 테스트가 파라미터가 나가는지 검증할 수 없다.
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

const listOf = async (query: Parameters<typeof toNoticeListParams>[1]) => {
  const { result } = renderHook(() => useNoticeList(toNoticeListParams(7, query)), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  return result.current.data!
}

describe('useNoticeList', () => {
  it('🔴 고정 공지가 먼저, 그 안에서 작성일 내림차순이다 (실측 2026-10-20)', async () => {
    const data = await listOf({})
    expect(data.totalCount).toBe(5)
    expect(data.items.map((row) => row.noticeSeq)).toEqual([5, 4, 3, 2, 1])
  })

  it('🔴 키워드는 제목·본문을 거르고 작성자는 거르지 않는다 (실측 2026-10-20)', async () => {
    // '외곽' 은 2번 **본문**에만 있다
    expect((await listOf({ q: '외곽' })).items.map((row) => row.noticeSeq)).toEqual([2])
    // '김관리' 는 2번 **작성자**다 — 걸리지 않는다
    expect((await listOf({ q: '김관리' })).items).toEqual([])
  })

  it('키워드·기간·페이징이 서버 파라미터로 나가 걸러진다', async () => {
    expect((await listOf({ q: '점검' })).items.map((row) => row.noticeSeq)).toEqual([4, 1])
    expect(
      (await listOf({ from: '2026-05-01', to: '2026-05-20' })).items.map((row) => row.noticeSeq)
    ).toEqual([3, 2])
    const page2 = await listOf({ page: '2', size: '2' })
    expect(page2.items.map((row) => row.noticeSeq)).toEqual([3, 2])
    expect(page2.totalCount).toBe(5)
  })

  it('params 가 null 이면 요청하지 않는다', () => {
    const { result } = renderHook(() => useNoticeList(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useNoticeDetail', () => {
  it('이미지·파일이 두 배열로 온다', async () => {
    const { result } = renderHook(() => useNoticeDetail(4), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.imageList).toHaveLength(2)
    expect(result.current.data?.fileList).toHaveLength(2)
  })

  it('없는 공지는 오류다', async () => {
    const { result } = renderHook(() => useNoticeDetail(999), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('noticeSeq 가 null 이면 요청하지 않는다', () => {
    const { result } = renderHook(() => useNoticeDetail(null), { wrapper })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
