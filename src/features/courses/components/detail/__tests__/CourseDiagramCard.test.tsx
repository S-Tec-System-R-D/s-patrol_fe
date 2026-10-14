import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import CourseDiagramCard from '../CourseDiagramCard'
import type { CourseDetailPoint } from '../../../types'

/**
 * `spec 023` T357 — **011 판 5건을 버리지 않고 서버 필드로 재작성**했다(`tasks.md` 제약 3).
 *
 * 다이어그램의 계약(zigzag 배치 · 커넥터 소요시간 · 비활성 노드 · 빈 상태)은 그대로고,
 * 바뀐 것은 **데이터의 출처**다: mock `ZonePointType` → 서버 `CourseDetailPoint`
 * (`order`→`orderNo` · `title`→`pointName` · `timeLimit`→`courseMin` · `isActive`→`useYn`).
 *
 * 🔴 **설명 줄 검증은 사라졌다** — 서버가 편성 지점의 `memo` 를 돌려주지 않는다(B-30).
 * 그 자리에 **"설명을 그리지 않는다" 를 고정하는 테스트**를 넣었다. 빼면 나중에 누가
 * 빈 자리를 채우려 `memo` 를 읽는 코드를 넣고, 항상 `undefined` 를 그린다.
 */

const buildPoints = (count: number): CourseDetailPoint[] =>
  Array.from({ length: count }, (_, i) => ({
    coursePointSeq: 100 + i + 1,
    pointSeq: i + 1,
    pointName: `지점${i + 1}`,
    gpsLat: null,
    gpsLng: null,
    authMethod: i % 2 === 0 ? 9 : 10, // 9=QR / 10=NFC
    orderNo: i + 1,
    useYn: true,
    courseMin: (i + 1) * 2 + 3, // 5,7,9,11,13,15,17...
  }))

describe('CourseDiagramCard', () => {
  it('빈 지점 배열이면 빈 상태 문구 표시', () => {
    render(<CourseDiagramCard points={[]} />)
    expect(screen.getByText('지점이 없습니다')).toBeInTheDocument()
  })

  it('🔴 지점 0개를 "준비 중" 이나 경고로 다루지 않는다 — 추가를 유도만 한다 (규칙 12)', () => {
    render(<CourseDiagramCard points={[]} />)

    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
    expect(screen.getByText(/지점을 추가하면/)).toBeInTheDocument()
  })

  it('4개 초과 시 다음 행으로 줄바꿈하고, 홀수 번째 행은 시각적으로 역순 배치(zigzag)', () => {
    const points = buildPoints(6) // row0: 1-4, row1: 5-6 (역순 표시 → 6,5)
    const { container } = render(<CourseDiagramCard points={points} />)

    const nodeNumbers = Array.from(container.querySelectorAll('.h-10.w-10')).map(
      (el) => el.textContent
    )
    expect(nodeNumbers).toEqual(['1', '2', '3', '4', '6', '5'])
  })

  it('구간 커넥터에 소요시간 라벨(도착 지점 courseMin) 렌더', () => {
    render(<CourseDiagramCard points={buildPoints(6)} />)

    // 1→2, 2→3, 3→4 (행 내부), 5→6 행간 세로 커넥터, 6→5(역순 표시된 행 내부)
    for (const label of ['7분', '9분', '11분', '13분', '15분']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('4의 배수가 아닌 지점 수(7개)도 정상 렌더', () => {
    const { container } = render(<CourseDiagramCard points={buildPoints(7)} />)

    expect(container.querySelectorAll('.h-10.w-10')).toHaveLength(7)
  })

  it('비활성 지점(useYn=false)은 muted 스타일 노드로 렌더', () => {
    const points = buildPoints(2)
    points[1].useYn = false
    const { container } = render(<CourseDiagramCard points={points} />)

    const nodes = container.querySelectorAll('.h-10.w-10')
    expect(nodes[0]).toHaveClass('bg-point-bg')
    expect(nodes[1]).toHaveClass('bg-muted')
  })

  it('인증수단 뱃지는 정수 코드에서 만든다 — 편성 지점에는 authMethodName 이 없다', () => {
    render(<CourseDiagramCard points={buildPoints(2)} />)

    expect(screen.getByText('QR')).toBeInTheDocument()
    expect(screen.getByText('NFC')).toBeInTheDocument()
  })

  it('🔴 모르는 인증수단 코드는 뱃지를 숨긴다 — 없는 이름을 만들지 않는다', () => {
    const points = buildPoints(1)
    points[0].authMethod = 99
    render(<CourseDiagramCard points={points} />)

    expect(screen.getByText('지점1')).toBeInTheDocument()
    expect(screen.queryByText('QR')).not.toBeInTheDocument()
    expect(screen.queryByText('NFC')).not.toBeInTheDocument()
    expect(screen.queryByText('99')).not.toBeInTheDocument()
  })

  it('🔴 지점 설명을 그리지 않는다 — 서버가 편성 지점의 memo 를 주지 않는다 (B-30)', () => {
    // 타입에 없는 필드를 억지로 실어도 화면에 나오지 않아야 한다. 나오면 누군가
    // "빈 자리" 를 채우려 쓰기 전용 필드를 읽는 코드를 넣은 것이다.
    const points = buildPoints(1).map((point) => ({ ...point, memo: '구간 메모' }))
    render(<CourseDiagramCard points={points} />)

    expect(screen.queryByText('구간 메모')).not.toBeInTheDocument()
  })
})
