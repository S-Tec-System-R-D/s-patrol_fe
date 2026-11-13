import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { HistoryPin, HistoryPinKind } from '../../../lib/historyCoords'
import HistoryMapCard from '../HistoryMapCard'

/**
 * 코스 경로 지도 (`spec 036` T517 → `spec 077`).
 *
 * ⚠️ **jsdom 에는 지도 렌더가 없다** — 여기서 거는 것은 **분기와 문구**다. 타일 · 마커 · 선택 강조는
 * 브라우저 캡처에서 본다.
 */

const pin = (order: number, kind: HistoryPinKind, over: Partial<HistoryPin> = {}): HistoryPin => ({
  detailSeq: order,
  order,
  name: `지점 ${order}`,
  lat: 37.4936 + order * 0.0002,
  lng: 127.0779 + order * 0.0002,
  kind,
  source: 'point',
  checkedAt: kind === 'checked' ? '2026-05-01T10:06:00' : null,
  authMethod: kind === 'checked' ? 9 : null,
  ...over,
})

describe('HistoryMapCard — 빠진 좌표 알리기', () => {
  it('🔴 좌표를 구하지 못한 지점을 수와 이름으로 적는다 (077)', () => {
    render(
      <HistoryMapCard
        pins={[pin(1, 'checked'), pin(2, 'waiting')]}
        missing={2}
        missingPoints={[
          { order: 3, name: '옥상' },
          { order: 5, name: '창고' },
        ]}
      />
    )

    expect(screen.getByText('코스 경로')).toBeInTheDocument()
    expect(screen.getByText('좌표 없음 2개 — 3. 옥상, 5. 창고')).toBeInTheDocument()
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
    render(<HistoryMapCard pins={[]} missing={3} />)

    expect(screen.getByText('표시할 좌표가 없습니다')).toBeInTheDocument()
  })
})

describe('HistoryMapCard — 🔴 범례가 핀 5종을 적는다 (077)', () => {
  it('인증 · 미완료 · 미인증 · 다음 · 대기 — 타임라인 뱃지와 같은 말', () => {
    render(<HistoryMapCard pins={[pin(1, 'checked')]} missing={0} />)

    for (const label of ['인증', '미완료', '미인증', '다음', '대기']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('그릴 수 없을 때는 범례도 띄우지 않는다 — 설명할 핀이 없다', () => {
    render(<HistoryMapCard pins={[]} missing={1} />)

    expect(screen.queryByText('미인증')).not.toBeInTheDocument()
  })
})
