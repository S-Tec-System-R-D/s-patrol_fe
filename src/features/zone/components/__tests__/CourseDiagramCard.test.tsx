import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CourseDiagramCard from '../CourseDiagramCard'
import type { ZonePointType } from '../../types'

const buildPoints = (count: number): ZonePointType[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    order: i + 1,
    title: `지점${i + 1}`,
    description: `설명${i + 1}`,
    timeLimit: (i + 1) * 2 + 3, // 5,7,9,11,13,15,17...
    authenticationMethod: i % 2 === 0 ? 'QR' : 'NFC',
    isActive: true,
  }))

describe('CourseDiagramCard', () => {
  it('빈 지점 배열이면 빈 상태 문구 표시', () => {
    render(<CourseDiagramCard points={[]} />)
    expect(screen.getByText('지점이 없습니다')).toBeInTheDocument()
  })

  it('4개 초과 시 다음 행으로 줄바꿈하고, 홀수 번째 행은 시각적으로 역순 배치(zigzag)', () => {
    const points = buildPoints(6) // row0: 1-4, row1: 5-6 (역순 표시 → 6,5)
    const { container } = render(<CourseDiagramCard points={points} />)

    const nodeNumbers = Array.from(container.querySelectorAll('.h-10.w-10')).map(
      (el) => el.textContent
    )
    expect(nodeNumbers).toEqual(['1', '2', '3', '4', '6', '5'])
  })

  it('구간 커넥터에 소요시간 라벨(도착 지점 timeLimit) 렌더', () => {
    const points = buildPoints(6)
    render(<CourseDiagramCard points={points} />)

    // 1→2, 2→3, 3→4 (행 내부), 5→6 행간 세로 커넥터, 6→5(역순 표시된 행 내부)
    expect(screen.getByText('7분')).toBeInTheDocument()
    expect(screen.getByText('9분')).toBeInTheDocument()
    expect(screen.getByText('11분')).toBeInTheDocument()
    expect(screen.getByText('13분')).toBeInTheDocument()
    expect(screen.getByText('15분')).toBeInTheDocument()
  })

  it('4의 배수가 아닌 지점 수(7개)도 정상 렌더', () => {
    const points = buildPoints(7)
    const { container } = render(<CourseDiagramCard points={points} />)
    const nodeNumbers = container.querySelectorAll('.h-10.w-10')
    expect(nodeNumbers).toHaveLength(7)
  })

  it('비활성 지점(isActive=false)은 muted 스타일 노드로 렌더', () => {
    const points = buildPoints(2)
    points[1].isActive = false
    const { container } = render(<CourseDiagramCard points={points} />)
    const nodes = container.querySelectorAll('.h-10.w-10')
    expect(nodes[0]).toHaveClass('bg-point-bg')
    expect(nodes[1]).toHaveClass('bg-muted')
  })
})
