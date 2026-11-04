/**
 * SSE 줄 파서 — `spec 069` T1145. 텍스트 청크를 받아 메시지 단위로 넘긴다.
 *
 * 🔴 **청크는 줄 중간에서 끊겨 온다** — 마지막 줄 조각은 다음 청크가 올 때까지 들고 있는다.
 * 줄 끝은 `\n` · `\r\n` 만 본다 — `\r` 단독은 다루지 않는다(실서버 확인은 T1157).
 * `id` 는 그 메시지의 것만 담는다 — 서버가 `Last-Event-ID` 재전송을 하지 않아(§5-1-D) 이어 받을 일이 없다.
 */

export interface SseMessage {
  /** `event:` 가 없으면 `message` */
  event: string
  /** 여러 `data:` 줄은 `\n` 으로 이어 붙인다 */
  data: string
  id: string | null
}

interface SseParserHandlers {
  onMessage: (message: SseMessage) => void
  /** `retry:` — 다시 연결까지 기다릴 ms */
  onRetry?: (ms: number) => void
}

export const createSseParser = ({ onMessage, onRetry }: SseParserHandlers) => {
  let rest = ''
  let event = ''
  let data: string[] = []
  let id: string | null = null

  const dispatch = () => {
    // 빈 메시지(`retry:` 만 있던 묶음 등)는 넘기지 않는다
    if (data.length > 0) {
      onMessage({ event: event || 'message', data: data.join('\n'), id })
    }
    event = ''
    data = []
    id = null
  }

  const readLine = (line: string) => {
    if (line === '') {
      dispatch()
      return
    }
    // `:` 로 시작 = 주석(서버의 20초 연결 유지 신호)
    if (line.startsWith(':')) return

    const colon = line.indexOf(':')
    const field = colon === -1 ? line : line.slice(0, colon)
    let value = colon === -1 ? '' : line.slice(colon + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
    else if (field === 'id') id = value
    else if (field === 'retry' && /^\d+$/.test(value)) onRetry?.(Number(value))
  }

  return (chunk: string) => {
    const lines = (rest + chunk).split('\n')
    rest = lines.pop() ?? ''
    lines.forEach((line) => readLine(line.endsWith('\r') ? line.slice(0, -1) : line))
  }
}
