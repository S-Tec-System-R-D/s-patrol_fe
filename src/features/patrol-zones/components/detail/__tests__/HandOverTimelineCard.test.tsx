import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { CheckDetailRow, HandOverRow } from '@/features/course-history/types'

import HandOverTimelineCard from '../HandOverTimelineCard'

const handOver: HandOverRow = {
  fromUserSeq: 13,
  fromUserName: '시작자',
  toUserSeq: 14,
  toUserName: '받은사람',
  lastOrderNo: 4,
  nextOrderNo: 5,
}

const checks = (...names: (string | null)[]) =>
  names.map((userName, index) => ({ orderNo: index + 1, userName })) as CheckDetailRow[]

describe('HandOverTimelineCard', () => {
  it('사람마다 담당 구간 · 사람 사이에 교대 위치', () => {
    render(<HandOverTimelineCard rows={[handOver]} checks={checks('시작자', '시작자', '시작자', '시작자', '받은사람')} />)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('시작자1~4번 지점4번 지점 후 교대')
    expect(rows[1]).toHaveTextContent('받은사람5번 지점')
    expect(rows[1]).not.toHaveTextContent('교대')
  })

  it('받은 사람이 처리 없이 끝나면 `처리한 지점 없음`', () => {
    render(<HandOverTimelineCard rows={[handOver]} checks={checks('시작자', '시작자', '시작자', '시작자', null)} />)
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('받은사람처리한 지점 없음')
  })
})
