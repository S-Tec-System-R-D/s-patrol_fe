import { describe, expect, it } from 'vitest'

import { handOverSegments } from '@/features/course-history/lib/handOverSegments'
import type { CheckDetailRow, HandOverRow } from '@/features/course-history/types'

const handOver = (from: string, to: string, lastOrderNo: number | null): HandOverRow => ({
  fromUserSeq: 1,
  fromUserName: from,
  toUserSeq: 2,
  toUserName: to,
  lastOrderNo,
  nextOrderNo: null,
})

const checks = (...names: (string | null)[]) =>
  names.map((userName, index) => ({ orderNo: index + 1, userName })) as CheckDetailRow[]

describe('handOverSegments', () => {
  it('회차 96 — 1~4번 · 5번', () => {
    expect(handOverSegments([handOver('A', 'B', 4)], checks('A', 'A', 'A', 'A', 'B'))).toEqual([
      { name: 'A', range: '1~4번 지점', handOverAfter: 4 },
      { name: 'B', range: '5번 지점', handOverAfter: null },
    ])
  })

  it('회차 94 — 받은 사람이 처리 없이 끝나면 구간이 없다', () => {
    const [, received] = handOverSegments([handOver('A', 'B', 4)], checks('A', 'A', 'A', 'A', null))
    expect(received.range).toBeNull()
  })

  it('A → B → A — 위치로 나눠 A 의 두 구간이 섞이지 않는다', () => {
    const rows = [handOver('A', 'B', 2), handOver('B', 'A', 3)]
    expect(handOverSegments(rows, checks('A', 'A', 'B', 'A', 'A')).map((row) => row.range)).toEqual([
      '1~2번 지점',
      '3번 지점',
      '4~5번 지점',
    ])
  })

  it('위치를 모르는 교대 — 넘긴 사람 구간은 비우고 위치도 적지 않는다', () => {
    const [first, second] = handOverSegments([handOver('A', 'B', null)], checks('B', 'B'))
    expect(first).toEqual({ name: 'A', range: null, handOverAfter: null })
    expect(second.range).toBe('1~2번 지점')
  })
})
