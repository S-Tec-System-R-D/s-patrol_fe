import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDashboardRealtime } from '@/features/dashboard/realtime/useDashboardRealtime'
import { getAccessToken } from '@/lib/auth/tokens'
import { ensureRefresh, finalizeAuthFailure } from '@/lib/axios'
import type { SseMessage } from '@/lib/sse/parseSse'
import { subscribeSse, type SseEnd } from '@/lib/sse/subscribeSse'

vi.mock('@/lib/sse/subscribeSse', () => ({ subscribeSse: vi.fn() }))
vi.mock('@/lib/auth/tokens', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/tokens')>()),
  getAccessToken: vi.fn(),
}))
vi.mock('@/lib/axios', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/axios')>()),
  ensureRefresh: vi.fn(),
  finalizeAuthFailure: vi.fn(),
}))

const subscribe = vi.mocked(subscribeSse)
const refresh = vi.mocked(ensureRefresh)
const failAuth = vi.mocked(finalizeAuthFailure)

interface Connection {
  token: string | null
  signal: AbortSignal
  send: (message: SseMessage) => void
  retry: (ms: number) => void
  end: (result: SseEnd) => void
}

/** 연결마다 하나 — 테스트가 메시지를 보내고 끝내는 법을 정한다 */
let connections: Connection[] = []

const connected: SseMessage = { event: 'connected', data: 'conn', id: null }

const setup = (siteSeq: number | null = 6) => {
  const queryClient = new QueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { invalidate, ...renderHook(() => useDashboardRealtime(siteSeq), { wrapper }) }
}

/** 대기 중인 Promise 를 흘려 보낸다 */
const settle = () => act(() => vi.advanceTimersByTimeAsync(0))

beforeEach(() => {
  vi.useFakeTimers()
  connections = []
  vi.mocked(getAccessToken).mockReturnValue('token-1')
  refresh.mockResolvedValue('token-2')
  subscribe.mockImplementation(
    (_url, { token, signal, onMessage, onRetry }) =>
      new Promise<SseEnd>((resolve) => {
        signal.addEventListener('abort', () => resolve({ kind: 'aborted' }))
        connections.push({
          token,
          signal,
          send: onMessage,
          retry: (ms) => onRetry?.(ms),
          end: resolve,
        })
      })
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('useDashboardRealtime — 연결', () => {
  it('연결 전엔 다시 연결 중 · connected 를 받으면 실시간', async () => {
    const { result } = setup()
    expect(result.current).toBe('reconnecting')
    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(connections[0].token).toBe('token-1')

    act(() => connections[0].send(connected))
    expect(result.current).toBe('connected')
  })

  it('사업장이 없으면 연결하지 않는다', () => {
    setup(null)
    expect(subscribe).not.toHaveBeenCalled()
  })

  it('화면을 떠나면 끊고 다시 붙지 않는다', async () => {
    const { unmount } = setup()
    unmount()
    expect(connections[0].signal.aborted).toBe(true)

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  it('알림을 처리기로 넘긴다 — 묶음 시간 뒤 다시 받기', async () => {
    const { invalidate } = setup()
    act(() => connections[0].send(connected))
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(invalidate).toHaveBeenCalled()
  })
})

describe('useDashboardRealtime — 재연결', () => {
  it('끊기면 다시 연결 중 · 기본 10초 뒤 다시 붙는다', async () => {
    const { result } = setup()
    act(() => connections[0].send(connected))

    connections[0].end({ kind: 'closed' })
    await settle()
    expect(result.current).toBe('reconnecting')

    await act(() => vi.advanceTimersByTimeAsync(9_999))
    expect(subscribe).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(1))
    expect(subscribe).toHaveBeenCalledTimes(2)
  })

  it('서버가 준 retry 만큼 기다린다', async () => {
    setup()
    act(() => connections[0].retry(3_000))

    connections[0].end({ kind: 'error' })
    await settle()
    await act(() => vi.advanceTimersByTimeAsync(3_000))
    expect(subscribe).toHaveBeenCalledTimes(2)
  })

  it('기다리는 중 화면을 떠나면 다시 붙지 않는다', async () => {
    const { unmount } = setup()
    connections[0].end({ kind: 'error' })
    await settle()

    unmount()
    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(subscribe).toHaveBeenCalledTimes(1)
  })
})

describe('useDashboardRealtime — 401', () => {
  it('재발급 후 기다리지 않고 새 토큰으로 다시 붙는다', async () => {
    setup()
    vi.mocked(getAccessToken).mockReturnValue('token-2')

    connections[0].end({ kind: 'unauthorized' })
    await settle()

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(subscribe).toHaveBeenCalledTimes(2)
    expect(connections[1].token).toBe('token-2')
  })

  it('재발급 뒤에도 401 이면 재발급을 되풀이하지 않고 retry 만큼 기다린다', async () => {
    setup()
    connections[0].end({ kind: 'unauthorized' })
    await settle()
    connections[1].end({ kind: 'unauthorized' })
    await settle()

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(subscribe).toHaveBeenCalledTimes(2)
    expect(failAuth).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(10_000))
    expect(subscribe).toHaveBeenCalledTimes(3)
  })

  it('연결에 성공했다면 다음 401 은 다시 재발급한다 — 3시간 뒤 만료', async () => {
    setup()
    connections[0].end({ kind: 'unauthorized' })
    await settle()
    act(() => connections[1].send(connected))
    connections[1].end({ kind: 'unauthorized' })
    await settle()

    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('재발급이 실패하면 인증 실패 처리하고 멈춘다', async () => {
    refresh.mockRejectedValue(new Error('토큰 재발급 실패'))
    setup()

    connections[0].end({ kind: 'unauthorized' })
    await settle()
    expect(failAuth).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(60_000))
    expect(subscribe).toHaveBeenCalledTimes(1)
  })
})
