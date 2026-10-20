import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import NoticeForm from '../NoticeForm'

describe('NoticeForm', () => {
  it('제목/본문 미입력 시 zod 에러 노출', async () => {
    render(<NoticeForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('제목을 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('본문을 입력해주세요.')).toBeInTheDocument()
  })

  it('기존 공지 값으로 필드 프리필', () => {
    // 🔴 기본값 출처가 서버 상세(`title`·`description`)로 바뀌었다(`spec 026` T588)
    render(<NoticeForm notice={{ title: '기존 공지 제목', description: '기존 공지 본문' }} />)

    expect(screen.getByDisplayValue('기존 공지 제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('기존 공지 본문')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })

  it('앱 푸시 체크는 작성·수정 모두 켜진 채로 연다', () => {
    const { unmount } = render(<NoticeForm />)
    expect(screen.getByRole('checkbox', { name: '저장 시 앱 푸시 발송' })).toBeChecked()
    unmount()

    render(<NoticeForm notice={{ title: '제목', description: '본문' }} />)
    expect(screen.getByRole('checkbox', { name: '저장 시 앱 푸시 발송' })).toBeChecked()
  })
})
