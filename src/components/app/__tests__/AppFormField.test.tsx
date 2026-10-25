import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AppFormField } from '../AppFormField'
import AppInput from '../AppInput'
import AppSelect from '../AppSelect'

/**
 * `AppFormField` → 안쪽 컨트롤 연결 (`spec 999` T864). 자식이 `Controller` 로 감싸져도 닿도록 컨텍스트로 내린다.
 */
describe('AppFormField — 접근성 연결', () => {
  it('라벨이 안쪽 AppInput 과 이어진다 · 도움말이 설명으로 읽힌다', () => {
    render(
      <AppFormField label="주소" hint="도로명 주소">
        <AppInput />
      </AppFormField>
    )
    const input = screen.getByLabelText('주소')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAccessibleDescription('도로명 주소')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('🔴 라벨이 안쪽 AppSelect 트리거와 이어진다 · 에러면 aria-invalid', () => {
    render(
      <AppFormField label="소속 그룹" error="소속 그룹을 선택해주세요.">
        <AppSelect options={[{ value: '1', label: '강동지사' }]} onChange={vi.fn()} />
      </AppFormField>
    )
    const trigger = screen.getByLabelText('소속 그룹')
    expect(trigger).toHaveAttribute('role', 'combobox')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAccessibleDescription('소속 그룹을 선택해주세요.')
  })

  it('밖의 AppSelect 는 그대로다(id · aria 없음)', () => {
    render(<AppSelect aria-label="권한" options={[]} onChange={vi.fn()} />)
    const trigger = screen.getByRole('combobox', { name: '권한' })
    expect(trigger).not.toHaveAttribute('aria-invalid')
    expect(trigger).not.toHaveAttribute('aria-describedby')
  })
})
