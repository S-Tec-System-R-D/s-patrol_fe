import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import AppDatePicker from '@/components/app/AppDatePicker'
import { AppFormField } from '@/components/app/AppFormField'

describe('AppDatePicker', () => {
  it('미선택 상태 → placeholder 표시', () => {
    render(<AppDatePicker value={{}} onChange={() => {}} />)
    expect(screen.getByText('기간 선택')).toBeInTheDocument()
  })

  it('from만 있으면 단일 날짜로 표시', () => {
    render(<AppDatePicker value={{ from: new Date(2026, 4, 30) }} onChange={() => {}} />)
    expect(screen.getByText('2026-05-30')).toBeInTheDocument()
  })

  it('from~to면 범위로 표시', () => {
    render(
      <AppDatePicker
        value={{ from: new Date(2026, 4, 1), to: new Date(2026, 4, 30) }}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('2026-05-01 ~ 2026-05-30')).toBeInTheDocument()
  })

  it('트리거를 열면 선택값의 달이 보이고, 날짜 선택 시 onChange가 호출된다', async () => {
    const onChange = vi.fn()
    render(<AppDatePicker value={{ from: new Date(2026, 4, 1) }} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByRole('grid', { name: '2026년 5월' })).toBeInTheDocument()

    await userEvent.click(screen.getByText('15'))
    expect(onChange).toHaveBeenCalled()
  })

  it('키보드만으로 열기 → 날짜 선택이 가능하다', async () => {
    const onChange = vi.fn()
    render(<AppDatePicker value={{ from: new Date(2026, 4, 1) }} onChange={onChange} />)

    screen.getByRole('button').focus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('grid', { name: '2026년 5월' })).toBeInTheDocument()

    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(onChange).toHaveBeenCalled()
  })

  it('disabled면 트리거가 비활성이다', () => {
    render(<AppDatePicker value={{}} onChange={() => {}} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('active면 트리거에 강조 표시가 붙는다', () => {
    render(<AppDatePicker value={{ from: new Date(2026, 4, 1) }} onChange={() => {}} active />)
    expect(screen.getByRole('button')).toHaveAttribute('data-active', 'true')
  })

  it('active를 넘기지 않으면 강조 속성이 붙지 않는다 (기존 호출부 무변경)', () => {
    render(<AppDatePicker value={{}} onChange={() => {}} />)
    expect(screen.getByRole('button')).not.toHaveAttribute('data-active')
  })

  it('AppFormField의 자식으로 들어가면 label과 hint가 함께 렌더된다', () => {
    render(
      <AppFormField label="조회 기간" hint="최대 3개월">
        <AppDatePicker value={{}} onChange={() => {}} />
      </AppFormField>
    )
    expect(screen.getByText('조회 기간')).toBeInTheDocument()
    expect(screen.getByText('최대 3개월')).toBeInTheDocument()
  })
})
