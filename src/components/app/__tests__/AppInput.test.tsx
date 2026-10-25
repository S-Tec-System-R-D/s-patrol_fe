import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import AppInput from '../AppInput'

/**
 * `AppInput` 라벨 ↔ 입력칸 연결 (`spec 999` T864 — OQ-F). 겉모습은 바꾸지 않고 속성만 더했다.
 */
describe('AppInput — 접근성 연결', () => {
  it('라벨로 입력칸을 찾는다 · 라벨을 누르면 포커스', async () => {
    render(<AppInput label="사번" />)
    const input = screen.getByLabelText('사번')
    expect(input.tagName).toBe('INPUT')

    await userEvent.click(screen.getByText('사번'))
    expect(input).toHaveFocus()
  })

  it('필수 표시(*)가 있어도 라벨로 찾는다', () => {
    render(<AppInput label="이름" required />)
    expect(screen.getByLabelText(/이름/)).toBeInTheDocument()
  })

  it('호출부 id 가 우선한다', () => {
    render(<AppInput label="연락처" id="phone" />)
    expect(screen.getByLabelText('연락처')).toHaveAttribute('id', 'phone')
  })

  it('🔴 에러가 있으면 aria-invalid + 에러 문구가 설명으로 읽힌다', () => {
    render(<AppInput label="사번" error="사번을 입력해주세요." />)
    const input = screen.getByLabelText('사번')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('사번을 입력해주세요.')
  })

  it('에러가 없으면 aria-invalid · describedby 를 달지 않는다', () => {
    render(<AppInput label="사번" />)
    const input = screen.getByLabelText('사번')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('password · search variant 도 연결된다', () => {
    render(
      <>
        <AppInput label="비밀번호" variant="password" />
        <AppInput label="검색" variant="search" />
      </>
    )
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('검색')).toBeInTheDocument()
  })
})
