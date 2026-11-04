import { describe, expect, it, vi } from 'vitest'

import { createSseParser, type SseMessage } from '@/lib/sse/parseSse'

const setup = () => {
  const messages: SseMessage[] = []
  const onRetry = vi.fn()
  const push = createSseParser({ onMessage: (message) => messages.push(message), onRetry })
  return { messages, onRetry, push }
}

describe('createSseParser', () => {
  it('빈 줄에서 메시지 하나를 넘긴다 — event · data · id', () => {
    const { messages, push } = setup()
    push('event: point-checked\nid: abc\ndata: {"detailSeq":288}\n\n')
    expect(messages).toEqual([{ event: 'point-checked', data: '{"detailSeq":288}', id: 'abc' }])
  })

  it('청크가 줄 중간에서 끊겨도 이어 붙인다', () => {
    const { messages, push } = setup()
    push('event: course-sta')
    push('rted\ndata: {"historySeq"')
    push(':92}\n')
    expect(messages).toEqual([])
    push('\n')
    expect(messages).toEqual([{ event: 'course-started', data: '{"historySeq":92}', id: null }])
  })

  it('한 청크에 여러 메시지가 오면 전부 넘긴다', () => {
    const { messages, push } = setup()
    push('event: a\ndata: 1\n\nevent: b\ndata: 2\n\n')
    expect(messages.map((m) => m.event)).toEqual(['a', 'b'])
  })

  it('`:` 주석(연결 유지 신호)은 무시한다', () => {
    const { messages, push } = setup()
    push(':\n\n: keep-alive\n\n')
    expect(messages).toEqual([])
  })

  it('`retry:` 는 ms 숫자로 알리고 메시지로 넘기지 않는다', () => {
    const { messages, onRetry, push } = setup()
    push('retry: 10000\n\nevent: connected\ndata: conn-1\n\n')
    expect(onRetry).toHaveBeenCalledWith(10000)
    expect(messages).toEqual([{ event: 'connected', data: 'conn-1', id: null }])
  })

  it('숫자가 아닌 `retry:` 는 무시한다', () => {
    const { onRetry, push } = setup()
    push('retry: soon\n\n')
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('여러 `data:` 줄은 줄바꿈으로 잇는다', () => {
    const { messages, push } = setup()
    push('data: 첫째\ndata: 둘째\n\n')
    expect(messages).toEqual([{ event: 'message', data: '첫째\n둘째', id: null }])
  })

  it('`\\r\\n` 줄 끝도 읽는다', () => {
    const { messages, push } = setup()
    push('event: connected\r\ndata: conn-1\r\n\r\n')
    expect(messages).toEqual([{ event: 'connected', data: 'conn-1', id: null }])
  })

  it('id 는 메시지마다 새로 시작한다', () => {
    const { messages, push } = setup()
    push('id: x\ndata: 1\n\ndata: 2\n\n')
    expect(messages.map((m) => m.id)).toEqual(['x', null])
  })
})
