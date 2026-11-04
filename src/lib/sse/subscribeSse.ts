import { createSseParser, type SseMessage } from './parseSse'

/**
 * SSE 연결 하나 — `spec 069` T1146. 스트림이 끝날 때까지 메시지를 넘기고, **어떻게 끝났는지**를 돌려준다.
 * 다시 연결 · 토큰 재발급은 부르는 쪽이 이 결과를 보고 정한다.
 *
 * 🔴 `EventSource` 를 쓰지 않는다 — 헤더를 못 붙여 토큰을 주소(`?access_token=`)에 실어야 하고, 401 을 구분할 수 없다.
 * 서버는 없음 · 무효 토큰에 **401 빈 body** 를 준다(§5-1-D).
 */

export type SseEnd =
  /** 서버가 스트림을 닫았다(재시작 등) */
  | { kind: 'closed' }
  /** 401 — 토큰 재발급 후 다시 연결 */
  | { kind: 'unauthorized' }
  /** 연결 실패 · 401 밖의 상태 코드 · 읽는 중 끊김 */
  | { kind: 'error' }
  /** 부른 쪽이 끊었다(화면을 떠남) */
  | { kind: 'aborted' }

interface SubscribeSseOptions {
  /** 없으면 헤더 없이 연결 → 서버 401 */
  token: string | null
  signal: AbortSignal
  onMessage: (message: SseMessage) => void
  onRetry?: (ms: number) => void
}

export const subscribeSse = async (
  url: string,
  { token, signal, onMessage, onRetry }: SubscribeSseOptions
): Promise<SseEnd> => {
  try {
    const headers: Record<string, string> = { Accept: 'text/event-stream' }
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(url, { headers, signal, cache: 'no-store' })
    if (response.status === 401) return { kind: 'unauthorized' }
    if (!response.ok || !response.body) return { kind: 'error' }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const push = createSseParser({ onMessage, onRetry })
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return { kind: 'closed' }
      // `stream: true` — 한글이 청크 사이에서 갈려도 깨지지 않게
      push(decoder.decode(value, { stream: true }))
    }
  } catch {
    return signal.aborted ? { kind: 'aborted' } : { kind: 'error' }
  }
}
