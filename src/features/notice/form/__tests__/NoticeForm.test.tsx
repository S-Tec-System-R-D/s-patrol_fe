import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Notice } from '../../types/notice'
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
    const notice: Notice = {
      id: 'n-01',
      index: 1,
      title: '기존 공지 제목',
      contentPreview: '기존 공지 본문',
      authorName: '이현장',
      createdAt: '2026-05-28',
      readByMe: true,
      isNew: false,
      hasAttachment: false,
      appPushSent: true,
      content: '기존 공지 본문',
      attachments: [],
    }

    render(<NoticeForm notice={notice} />)

    expect(screen.getByDisplayValue('기존 공지 제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('기존 공지 본문')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })
})
