import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { makeAccessToken } from '@/test/jwt'

import { HISTORY_PAGE_SIZE, usePointHistory } from '../usePointHistory'

/**
 * 🔴 **`pageSize` 상한 결함의 회귀 테스트** (실측 2026-10-14).
 *
 * 서버 상한은 **100** 이고 넘기면 **400** 이다. 우리는 **200** 을 보내고 있었고, 그래서
 * 지점 상세의 순찰 기록이 **실서버에서 통째로 실패**하면서 화면에는 "순찰 기록이 없습니다"
 * 가 떴다 — 장애가 빈 상태로 읽혔다. mock 이 200 을 받아줘 **dev 에서는 멀쩡해 보였다.**
 *
 * 이제 MSW 핸들러도 상한을 검증하므로, 상한을 넘기는 값으로 되돌리면 **이 테스트가 깨진다.**
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

describe('usePointHistory — pageSize 상한', () => {
  it('🔴 서버 상한(100)을 넘지 않는다', () => {
    expect(HISTORY_PAGE_SIZE).toBeLessThanOrEqual(100)
  })

  it('기본 호출이 성공한다 — 상한을 넘으면 mock 이 400 을 준다', async () => {
    const { result } = renderHook(() => usePointHistory(7, 1, '2026-10-01', '2026-10-14'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.isError).toBe(false)
    expect(result.current.data?.items).toBeDefined()
  })
})
