import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetUserStore } from '@/mocks/handlers/users'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { fetchUserDetail } from '../../api/getUserDetail'
import { fetchUserList } from '../../api/getUserList'
import AddWorkerForm from '../AddWorkerForm'
import EditWorkerForm from '../EditWorkerForm'

const ADD_USER_PATH = '/api/v1/User/W/sign/AddUser'
const UPDATE_USER_PATH = '/api/v1/User/W/sign/UpdateUser'

const renderWithQuery = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

/** multipart 본문을 [키, 값] 으로 기록하고 처리는 기본 핸들러(상태 보유)에 넘긴다 */
const recordMultipart = (path: string) => {
  const sent: [string, string][] = []
  server.use(
    http.post(path, async ({ request }) => {
      const form = await request.clone().formData()
      for (const [key, value] of form.entries()) {
        sent.push([key, typeof value === 'string' ? value : value.name])
      }
      return undefined
    })
  )
  return sent
}

const fillAdd = async (
  user: ReturnType<typeof userEvent.setup>,
  over: Partial<Record<'name' | 'loginId' | 'phone' | 'loginPw', string>> = {}
) => {
  const v = { name: '새근무자', loginId: '990001', phone: '010-1234-5678', loginPw: 'Abcd123!', ...over }
  // 🔴 라벨로 찾는다 — `AppInput` 라벨 연결(999 US3) 전에는 placeholder 로 우회했다(OQ-F)
  await user.type(screen.getByLabelText(/^이름/), v.name)
  await user.type(screen.getByLabelText(/^사번/), v.loginId)
  await user.type(screen.getByLabelText(/^연락처/), v.phone)
  await user.type(screen.getByLabelText(/^초기비밀번호/), v.loginPw)
}

beforeEach(() => {
  resetUserStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

describe('AddWorkerForm — 입력', () => {
  it('필수값 미입력 시 zod 에러 노출', async () => {
    renderWithQuery(<AddWorkerForm />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('두 글자 이상 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('사번을 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('010-0000-0000 형식으로 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('8자리 이상 입력해주세요.')).toBeInTheDocument()
  })

  it('🔴 사번·비밀번호는 로그인과 같은 규칙이다 — 서버는 검사하지 않는다(B-45)', async () => {
    renderWithQuery(<AddWorkerForm />)
    const user = userEvent.setup()
    await fillAdd(user, { loginId: '123456789', loginPw: 'abcdefgh' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('8자리 이하로 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('숫자를 1자 이상 포함해주세요.')).toBeInTheDocument()
  })
})

describe('AddWorkerForm — 제출', () => {
  it('근무자(7)로, 연락처는 숫자만 보내고 성공하면 닫고 목록에 나온다', async () => {
    const sent = recordMultipart(ADD_USER_PATH)
    const onSuccess = vi.fn()
    renderWithQuery(<AddWorkerForm onSuccess={onSuccess} />)
    const user = userEvent.setup()
    await fillAdd(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(Object.fromEntries(sent)).toEqual({
      siteSeq: '7',
      codeSeq: '7',
      loginId: '990001',
      loginPw: 'Abcd123!',
      name: '새근무자',
      phone: '01012345678',
    })
    const { items } = await fetchUserList({ siteId: 7, pageNumber: 1, pageSize: 100 })
    expect(items.find((u) => u.loginId === '990001')).toMatchObject({ userName: '새근무자', codeSeq: 7 })
  })

  it('사번이 겹치면 닫지 않고 입력이 남는다', async () => {
    const onSuccess = vi.fn()
    renderWithQuery(<AddWorkerForm onSuccess={onSuccess} />)
    const user = userEvent.setup()
    // 시드 101 의 사번(240000 + userSeq)
    await fillAdd(user, { loginId: '240101' })
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '등록' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByDisplayValue('240101')).toBeInTheDocument()
  })

  it('처리 중에는 버튼이 잠겨 연타해도 한 번만 보낸다', async () => {
    let calls = 0
    server.use(
      http.post(ADD_USER_PATH, async () => {
        calls += 1
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ message: 'ok', data: true, code: 200 })
      })
    )
    const onSuccess = vi.fn()
    renderWithQuery(<AddWorkerForm onSuccess={onSuccess} />)
    const user = userEvent.setup()
    await fillAdd(user)
    const submit = screen.getByRole('button', { name: '등록' })
    await user.click(submit)
    await user.click(submit)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(calls).toBe(1)
  })
})

describe('EditWorkerForm', () => {
  // 🔴 기본값 출처가 서버 상세(`userName`·`phone`·`siteName`)로 바뀌었다(`spec 038` T617)
  const user = { userSeq: 101, userName: '김민준', phone: '010-2345-6789', siteName: '강동 테크노타워' }

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

  it('이름·연락처(숫자만)만 보내고 비밀번호는 보내지 않는다 — 성공하면 상세가 바뀐다', async () => {
    const sent = recordMultipart(UPDATE_USER_PATH)
    const onSuccess = vi.fn()
    renderWithQuery(<EditWorkerForm user={user} onSuccess={onSuccess} />)
    const ue = userEvent.setup()
    const name = screen.getByDisplayValue('김민준')
    await ue.clear(name)
    await ue.type(name, '김민준2')
    const phone = screen.getByDisplayValue('010-2345-6789')
    await ue.clear(phone)
    await ue.type(phone, '010-9999-8888')
    await ue.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(sent).toEqual([
      ['userSeq', '101'],
      ['name', '김민준2'],
      ['phone', '01099998888'],
    ])
    expect(await fetchUserDetail(101)).toMatchObject({ userName: '김민준2', phone: '01099998888' })
  })

  it('이미 지워진 근무자면 닫지 않는다', async () => {
    const onSuccess = vi.fn()
    renderWithQuery(<EditWorkerForm user={{ ...user, userSeq: 999 }} onSuccess={onSuccess} />)
    const ue = userEvent.setup()
    await ue.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
