import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import AppFilterPopover from '../AppFilterPopover'

/**
 * `spec 027` Phase 4 — `AppFilterButton` 의 **첫 조립**.
 *
 * 🔴 여기서 고정하는 계약 2개:
 * 1. **"전체" 는 값이 아니라 해제다** — `onChange(undefined)`. `ALL` 센티넬이 URL·서버로
 *    새 나가면 "전체" 가 필터값처럼 전송된다(018 규약 / `spec 022` 규칙 8).
 * 2. **선택값이 버튼 라벨에 붙는다** — 팝오버를 열지 않고도 무엇이 걸려 있는지 알아야 한다.
 */

const options = [
  { value: '9', label: 'QR' },
  { value: '10', label: 'NFC' },
]

const renderPopover = (value?: string, onChange = vi.fn()) => {
  render(
    <AppFilterPopover label="인증수단" options={options} value={value} onChange={onChange} />
  )
  return { onChange }
}

describe('AppFilterPopover', () => {
  it('선택이 없으면 버튼에 라벨만 보인다', () => {
    renderPopover()

    expect(screen.getByRole('button', { name: /인증수단/ })).toBeInTheDocument()
    expect(screen.queryByText('인증수단: QR')).not.toBeInTheDocument()
  })

  it('🔴 선택값이 버튼 라벨에 붙는다 — 열지 않고도 무엇이 걸렸는지 안다', () => {
    renderPopover('9')

    expect(screen.getByText('인증수단: QR')).toBeInTheDocument()
  })

  it('버튼을 누르면 옵션이 열린다 ("전체" 포함)', async () => {
    const user = userEvent.setup()
    renderPopover()

    await user.click(screen.getByRole('button', { name: /인증수단/ }))

    expect(await screen.findByRole('option', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'QR' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'NFC' })).toBeInTheDocument()
  })

  it('옵션을 고르면 그 값을 넘긴다', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPopover()

    await user.click(screen.getByRole('button', { name: /인증수단/ }))
    await user.click(await screen.findByRole('option', { name: 'NFC' }))

    expect(onChange).toHaveBeenCalledWith('10')
  })

  it('🔴 "전체" 는 undefined 를 넘긴다 — 센티넬이 URL·서버로 새지 않는다', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPopover('9')

    await user.click(screen.getByRole('button', { name: /인증수단/ }))
    await user.click(await screen.findByRole('option', { name: '전체' }))

    expect(onChange).toHaveBeenCalledWith(undefined)
  })

  it('현재 선택이 option 으로 표시된다 — 색·굵기만으로 전달하지 않는다', async () => {
    const user = userEvent.setup()
    renderPopover('10')

    await user.click(screen.getByRole('button', { name: /인증수단/ }))

    expect(await screen.findByRole('option', { name: /NFC/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('option', { name: 'QR' })).toHaveAttribute('aria-selected', 'false')
  })
})
