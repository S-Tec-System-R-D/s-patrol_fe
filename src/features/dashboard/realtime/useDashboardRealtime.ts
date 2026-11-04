import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getAccessToken } from '@/lib/auth/tokens'
import { ensureRefresh, finalizeAuthFailure } from '@/lib/axios'
import { subscribeSse } from '@/lib/sse/subscribeSse'

import { createDashboardEventHandler } from './handleDashboardEvent'

/**
 * 대시보드 실시간 연결 — `spec 069` T1150. **화면에 있는 동안만** 연결하고, 끊기면 저절로 다시 붙는다.
 *
 * 🔴 **401 은 재발급 후 곧바로 다시 붙되, 한 번만이다** — 새 토큰으로도 401 이면 SSE 서버 쪽 문제일 수 있다.
 * 곧바로 되풀이하면 재발급을 끝없이 부르므로 그때는 `retry` 만큼 기다린다. 로그아웃은 재발급 자체가 실패할 때뿐이다.
 * 사업장 전환은 `ServiceLayout` 재마운트로 다시 붙는다(`spec 061`).
 */

export type RealtimeStatus = 'connected' | 'reconnecting'

const SSE_URL = `${import.meta.env.VITE_SSE_BASE_URL ?? ''}/api/v1/Sse/subscribe`
/** 서버가 첫 메시지로 주는 값(실측)과 같다 — 첫 연결이 실패하면 받지 못한다 */
const DEFAULT_RETRY_MS = 10_000

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    const timer = setTimeout(done, ms)
    signal.addEventListener('abort', done)
  })

export const useDashboardRealtime = (siteSeq: number | null): RealtimeStatus => {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<RealtimeStatus>('reconnecting')

  useEffect(() => {
    if (siteSeq === null) return

    const controller = new AbortController()
    const { signal } = controller
    const handler = createDashboardEventHandler(queryClient, siteSeq)

    const run = async () => {
      let retryMs = DEFAULT_RETRY_MS
      let justRefreshed = false

      while (!signal.aborted) {
        const end = await subscribeSse(SSE_URL, {
          token: getAccessToken(),
          signal,
          onRetry: (ms) => {
            retryMs = ms
          },
          onMessage: (message) => {
            if (message.event === 'connected') {
              justRefreshed = false
              setStatus('connected')
            }
            handler.handle(message)
          },
        })
        if (end.kind === 'aborted') return

        setStatus('reconnecting')

        if (end.kind === 'unauthorized' && !justRefreshed) {
          try {
            await ensureRefresh()
          } catch {
            finalizeAuthFailure()
            return
          }
          justRefreshed = true
          continue
        }
        await wait(retryMs, signal)
      }
    }
    void run()

    return () => {
      controller.abort()
      handler.dispose()
    }
  }, [queryClient, siteSeq])

  return status
}
