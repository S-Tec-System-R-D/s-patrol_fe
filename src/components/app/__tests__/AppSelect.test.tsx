import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { FilterIcon } from 'lucide-react'
import AppSelect from '@/components/app/AppSelect'
import { AppFormField } from '@/components/app/AppFormField'

const options = [
  { value: 'COMPLETE', label: '완료' },
  { value: 'INCOMPLETE', label: '미완료' },
  { value: 'IN_PROGRESS', label: '진행중' },
]

describe('AppSelect', () => {
  it('미선택 상태 → placeholder 표시', () => {
    render(<AppSelect options={options} onChange={() => {}} placeholder="결과 선택" />)
    expect(screen.getByText('결과 선택')).toBeInTheDocument()
  })

  it('선택값이 있으면 해당 옵션의 label 표시', () => {
    render(<AppSelect options={options} value="INCOMPLETE" onChange={() => {}} />)
    expect(screen.getByText('미완료')).toBeInTheDocument()
  })

  it('옵션 선택 시 onChange가 선택값으로 호출된다', async () => {
    const onChange = vi.fn()
    render(<AppSelect options={options} onChange={onChange} />)

    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: '진행중' }))

    expect(onChange).toHaveBeenCalledWith('IN_PROGRESS')
  })

  it('키보드만으로 열기 → 선택이 가능하다', async () => {
    const onChange = vi.fn()
    render(<AppSelect options={options} onChange={onChange} />)

    const trigger = screen.getByRole('combobox')
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('listbox')).toBeInTheDocument()

    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onChange).toHaveBeenCalled()
  })

  it('disabled면 트리거가 비활성이다', () => {
    render(<AppSelect options={options} onChange={() => {}} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('icon을 넘기면 트리거에 아이콘이 함께 렌더된다', () => {
    const { rerender } = render(<AppSelect options={options} onChange={() => {}} />)
    const svgCount = () => screen.getByRole('combobox').querySelectorAll('svg').length
    const withoutIcon = svgCount()

    rerender(<AppSelect options={options} onChange={() => {}} icon={FilterIcon} />)
    expect(svgCount()).toBe(withoutIcon + 1)
  })

  it('active면 트리거에 강조 표시가 붙는다', () => {
    render(<AppSelect options={options} onChange={() => {}} active />)
    expect(screen.getByRole('combobox')).toHaveAttribute('data-active', 'true')
  })

  it('icon·active를 넘기지 않으면 강조 속성이 붙지 않는다 (기존 호출부 무변경)', () => {
    render(<AppSelect options={options} onChange={() => {}} />)
    expect(screen.getByRole('combobox')).not.toHaveAttribute('data-active')
  })

  it('AppFormField의 자식으로 들어가면 label과 error가 함께 렌더된다', () => {
    render(
      <AppFormField label="순찰 결과" required error="필수 항목입니다">
        <AppSelect options={options} onChange={() => {}} />
      </AppFormField>
    )
    expect(screen.getByText('순찰 결과')).toBeInTheDocument()
    expect(screen.getByText('필수 항목입니다')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
