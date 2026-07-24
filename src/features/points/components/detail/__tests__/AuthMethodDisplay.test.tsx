import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthMethodDisplay from '../AuthMethodDisplay'

describe('AuthMethodDisplay', () => {
  it('QR일 때 QR만 강조', () => {
    render(<AuthMethodDisplay value="QR" />)
    expect(screen.getByText('QR').closest('div')).toHaveClass('border-point')
    expect(screen.getByText('NFC').closest('div')).not.toHaveClass('border-point')
  })

  it('NFC일 때 NFC만 강조', () => {
    render(<AuthMethodDisplay value="NFC" />)
    expect(screen.getByText('NFC').closest('div')).toHaveClass('border-point')
    expect(screen.getByText('QR').closest('div')).not.toHaveClass('border-point')
  })

  it('클릭해도 클릭 핸들러가 없어 상태 변화 없음(읽기전용)', async () => {
    const user = userEvent.setup()
    render(<AuthMethodDisplay value="QR" />)
    const nfcOption = screen.getByText('NFC').closest('div')!
    const onClick = vi.fn()
    nfcOption.addEventListener('click', onClick)
    await user.click(nfcOption)
    expect(screen.getByText('QR').closest('div')).toHaveClass('border-point')
    expect(screen.getByText('NFC').closest('div')).not.toHaveClass('border-point')
  })
})
