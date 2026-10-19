import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { HistoryPin, HistoryPinKind } from '../../../lib/historyCoords'
import HistoryMapCard from '../HistoryMapCard'

/**
 * 인증 위치 지도 (`spec 036` T517·T518).
 *
 * ⚠️ **jsdom 에는 지도 렌더가 없다**(레이아웃 크기가 전부 0이라 타일이 뜨지 않는다).
 * 여기서 거는 것은 **분기와 문구**다 — 실제 타일·마커·경로선은 브라우저 확인(T525)에서 본다.
 *
 * 🔴 **가장 중요한 단정 둘**: ① "좌표 없음 N개" 를 적는다(조용히 빼면 핀이 빠진 지도가 되고
 * 보는 사람은 그 회차가 원래 그 지점들만 돈 줄 안다) ② **범례가 3종을 다 적는다**(핀이
 * 3종인데 범례가 없으면 색을 추측하게 된다).
 */

const pin = (order: number, kind: HistoryPinKind, over: Partial<HistoryPin> = {}): HistoryPin => ({
  order,
  name: `지점 ${order}`,
  lat: 37.4936 + order * 0.0002,
  lng: 127.0779 + order * 0.0002,
  kind,
  source: kind === 'checked' ? 'check' : 'point',
  checkedAt: kind === 'checked' ? '2026-05-01T10:06:00' : null,
  authMethod: kind === 'checked' ? 9 : null,
  ...over,
})

describe('HistoryMapCard — 빠진 좌표 알리기', () => {
  it('🔴 좌표를 구하지 못한 지점 수를 머리에 적는다', () => {
    render(<HistoryMapCard pins={[pin(1, 'checked'), pin(2, 'norecord')]} missing={2} />)

    expect(screen.getByText('인증 위치')).toBeInTheDocument()
    expect(screen.getByText('좌표 없음 2개')).toBeInTheDocument()
  })

  it('빠진 것이 없으면 그 문구를 띄우지 않는다 — 없는 문제를 말하지 않는다', () => {
    render(<HistoryMapCard pins={[pin(1, 'checked')]} missing={0} />)

    expect(screen.queryByText(/좌표 없음/)).not.toBeInTheDocument()
  })

  it('🔴 핀이 0개여도 빠진 수는 적는다 — 좌표가 없다는 사실이 사라지면 안 된다', () => {
    render(<HistoryMapCard pins={[]} missing={5} />)

    expect(screen.getByText('좌표 없음 5개')).toBeInTheDocument()
  })
})

describe('HistoryMapCard — 그릴 수 없는 경우', () => {
  it('🔴 핀이 0개면 안내를 보여준다 — 장애 문구를 쓰지 않는다', () => {
    // 지점에 좌표가 등록되지 않은 코스가 실재한다(실측 7개 코스에서 15/18)
    render(<HistoryMapCard pins={[]} missing={3} />)

    expect(screen.getByText('표시할 좌표가 없습니다')).toBeInTheDocument()
    expect(screen.getByText(/지점에 좌표가 등록되면/)).toBeInTheDocument()
  })
})

describe('HistoryMapCard — 🔴 범례가 핀 3종을 적는다', () => {
  it('인증 · 미인증(방문 기록 있음) · 기록 없음 을 모두 적는다', () => {
    render(<HistoryMapCard pins={[pin(1, 'checked')]} missing={0} />)

    expect(screen.getByText('인증')).toBeInTheDocument()
    expect(screen.getByText('미인증(방문 기록 있음)')).toBeInTheDocument()
    expect(screen.getByText('기록 없음')).toBeInTheDocument()
  })

  it('핀이 한 종류만 있어도 범례는 3종을 그대로 둔다 — 짝이 바뀌면 혼동한다', () => {
    render(<HistoryMapCard pins={[pin(1, 'norecord')]} missing={0} />)

    expect(screen.getByText('인증')).toBeInTheDocument()
    expect(screen.getByText('기록 없음')).toBeInTheDocument()
  })

  it('그릴 수 없을 때는 범례도 띄우지 않는다 — 설명할 핀이 없다', () => {
    render(<HistoryMapCard pins={[]} missing={1} />)

    expect(screen.queryByText('미인증(방문 기록 있음)')).not.toBeInTheDocument()
  })
})
