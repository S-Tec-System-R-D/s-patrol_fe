import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SseMessage } from '@/lib/sse/parseSse'
import { subscribeSse } from '@/lib/sse/subscribeSse'

const SSE_URL = 'http://sse.test/api/v1/Sse/subscribe'

/** 청크 배열을 차례로 흘리고 닫는 스트림 응답 */
const streamResponse = (chunks: Uint8Array[], init?: ResponseInit) =>
  new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk))
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' }, ...init }
  )

const encode = (text: string) => new TextEncoder().encode(text)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('subscribeSse', () => {
  it('토큰을 Authorization 헤더로 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await subscribeSse(SSE_URL, { token: 'tkn', signal: new AbortController().signal, onMessage: vi.fn() })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tkn')
  })

  it('토큰이 없으면 헤더 없이 연결한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await subscribeSse(SSE_URL, { token: null, signal: new AbortController().signal, onMessage: vi.fn() })

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('메시지 · retry 를 넘기고, 서버가 닫으면 closed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(streamResponse([encode('retry: 10000\n\nevent: conn'), encode('ected\ndata: c1\n\n')]))
    )
    const messages: SseMessage[] = []
    const onRetry = vi.fn()

    const end = await subscribeSse(SSE_URL, {
      token: 't',
      signal: new AbortController().signal,
      onMessage: (m) => messages.push(m),
      onRetry,
    })

    expect(end).toEqual({ kind: 'closed' })
    expect(onRetry).toHaveBeenCalledWith(10000)
    expect(messages).toEqual([{ event: 'connected', data: 'c1', id: null }])
  })

  it('한글이 청크 사이에서 바이트 단위로 갈려도 깨지지 않는다', async () => {
    const bytes = encode('data: 정문\n\n')
    // '정' 의 3바이트 중간에서 자른다
    const cut = 'data: '.length + 1
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamResponse([bytes.slice(0, cut), bytes.slice(cut)])))
    const messages: SseMessage[] = []

    await subscribeSse(SSE_URL, { token: 't', signal: new AbortController().signal, onMessage: (m) => messages.push(m) })

    expect(messages[0].data).toBe('정문')
  })

  it('401 은 unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    const end = await subscribeSse(SSE_URL, { token: 'old', signal: new AbortController().signal, onMessage: vi.fn() })

    expect(end).toEqual({ kind: 'unauthorized' })
  })

  it('401 밖의 실패 상태 코드는 error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))

    const end = await subscribeSse(SSE_URL, { token: 't', signal: new AbortController().signal, onMessage: vi.fn() })

    expect(end).toEqual({ kind: 'error' })
  })

  it('연결 실패(네트워크)는 error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const end = await subscribeSse(SSE_URL, { token: 't', signal: new AbortController().signal, onMessage: vi.fn() })

    expect(end).toEqual({ kind: 'error' })
  })

  it('부른 쪽이 끊으면(abort) aborted', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
          })
      )
    )

    const pending = subscribeSse(SSE_URL, { token: 't', signal: controller.signal, onMessage: vi.fn() })
    controller.abort()

    expect(await pending).toEqual({ kind: 'aborted' })
  })
})
