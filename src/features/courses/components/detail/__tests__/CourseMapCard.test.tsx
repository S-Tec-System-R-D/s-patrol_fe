import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CourseMapCard from '../CourseMapCard'
import type { CoursePin } from '../../../lib/courseCoords'

/**
 * 순찰 동선 지도 (`spec 032` T482).
 *
 * ⚠️ **jsdom 에는 지도 렌더가 없다**(레이아웃 크기가 전부 0이라 타일이 뜨지 않는다).
 * 여기서 거는 것은 **분기와 문구**다 — 실제 타일·마커는 브라우저 확인(T484)에서 본다.
 *
 * 🔴 **가장 중요한 단정은 "좌표 없음 N개 를 적는다"** 다. 조용히 빼면 **핀이 빠진 지도**가
 * 되고, 보는 사람은 그 코스가 원래 그 지점들만 도는 줄 안다.
 */

const pin = (order: number, name: string): CoursePin => ({
  order,
  name,
  lat: 37.4936 + order * 0.0002,
  lng: 127.0779 + order * 0.0002,
})

describe('CourseMapCard — 빠진 좌표 알리기', () => {
  it('🔴 좌표 없는 지점 수를 머리에 적는다', () => {
    render(<CourseMapCard pins={[pin(1, 'A'), pin(2, 'B')]} missing={1} />)

    expect(screen.getByText('순찰 동선')).toBeInTheDocument()
    expect(screen.getByText('좌표 없음 1개')).toBeInTheDocument()
  })

  it('빠진 것이 없으면 그 문구를 띄우지 않는다 — 없는 문제를 말하지 않는다', () => {
    render(<CourseMapCard pins={[pin(1, 'A')]} missing={0} />)

    expect(screen.queryByText(/좌표 없음/)).not.toBeInTheDocument()
  })
})

describe('CourseMapCard — 그릴 수 없는 경우', () => {
  it('🔴 핀이 0개면 안내를 보여준다 — 빈 회색 박스를 남기지 않는다', () => {
    // 호출부가 이 경우 다이어그램으로 되돌아가므로 보통 오지 않는다 — 방어선이다
    render(<CourseMapCard pins={[]} missing={3} />)

    expect(screen.getByText('표시할 좌표가 없습니다')).toBeInTheDocument()
  })

  it('안내에도 **다음에 무엇이 필요한지**를 적는다', () => {
    render(<CourseMapCard pins={[]} missing={3} />)

    expect(screen.getByText(/지점에 좌표가 등록되면/)).toBeInTheDocument()
  })
})
