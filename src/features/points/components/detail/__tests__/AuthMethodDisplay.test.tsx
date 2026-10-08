import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthMethodDisplay from '../AuthMethodDisplay'

/**
 * 🔴 **027 에서 계약이 바뀌었다 — 세그먼트 → 값 표시.**
 *
 * 이전 3건은 "QR/NFC 2칸 중 하나만 강조" 를 고정했다. 그 모양이 폼 필드와 똑같아
 * **읽기 전용인데 토글로 보이는** 것이 문제였으므로(실제 렌더 확인 2026-10-08),
 * 지금은 **선택되지 않은 값을 아예 그리지 않는다.** 여기서 고정하는 것은 그 결정이다.
 */
describe('AuthMethodDisplay', () => {
  it('🔴 현재 값만 그린다 — 선택되지 않은 쪽을 보여주지 않는다', () => {
    render(<AuthMethodDisplay value="QR" />)

    expect(screen.getByText('QR')).toBeInTheDocument()
    // NFC 가 함께 보이면 "바꿀 수 있는 것" 으로 읽힌다
    expect(screen.queryByText('NFC')).not.toBeInTheDocument()
  })

  it('NFC 지점은 NFC 만 그린다', () => {
    render(<AuthMethodDisplay value="NFC" />)

    expect(screen.getByText('NFC')).toBeInTheDocument()
    expect(screen.queryByText('QR')).not.toBeInTheDocument()
  })

  it('🔴 미실측 코드(null)면 아무것도 그리지 않는다 — 호출부가 안내를 맡는다', () => {
    const { container } = render(<AuthMethodDisplay value={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
