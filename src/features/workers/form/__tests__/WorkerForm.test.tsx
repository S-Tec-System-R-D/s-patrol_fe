import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import AddWorkerForm from '../AddWorkerForm'
import EditWorkerForm from '../EditWorkerForm'

const renderWithQuery = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AddWorkerForm', () => {
  it('필수값 미입력 시 zod 에러 노출', async () => {
    renderWithQuery(<AddWorkerForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('두 글자 이상 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('010-0000-0000 형식으로 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('8자리 이상 입력해주세요.')).toBeInTheDocument()
  })
})

describe('EditWorkerForm', () => {
  // 🔴 기본값 출처가 서버 상세(`userName`·`phone`·`siteName`)로 바뀌었다(`spec 038` T617)
  const user = { userName: '김민준', phone: '010-2345-6789', siteName: '강동 테크노타워' }

  it('기존 근무자 정보로 필드 프리필', () => {
    renderWithQuery(<EditWorkerForm user={user} />)

    expect(screen.getByDisplayValue('김민준')).toBeInTheDocument()
    expect(screen.getByDisplayValue('010-2345-6789')).toBeInTheDocument()
    expect(screen.getByDisplayValue('강동 테크노타워')).toBeInTheDocument()
  })

  it('🔴 하이픈 없는 서버 연락처를 형식에 맞춰 채운다', () => {
    renderWithQuery(<EditWorkerForm user={{ ...user, phone: '01023456789' }} />)

    expect(screen.getByDisplayValue('010-2345-6789')).toBeInTheDocument()
  })
})
