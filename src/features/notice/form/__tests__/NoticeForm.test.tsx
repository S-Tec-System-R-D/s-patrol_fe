import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetNoticeStore } from '@/mocks/handlers/notices'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { fetchNoticeList } from '../../api/getNoticeList'
import NoticeForm from '../NoticeForm'

/**
 * 공지 작성 폼 — `spec 040` Phase 2.
 *
 * 🔴 multipart 본문을 MSW 에서 직접 읽어 확인한다 — 필드 이름(`description`·`isPin`·`file`)이 하나라도
 * 틀리면 서버는 400 이거나 **조용히 버린다**.
 */

const ADD_NOTICE_PATH = '/api/v1/Notice/W/sign/AddNotice'

const renderForm = (props: Parameters<typeof NoticeForm>[0] = {}) => {
  const onSuccess = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <NoticeForm onSuccess={onSuccess} {...props} />
    </QueryClientProvider>
  )
  return { onSuccess }
}

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByPlaceholderText('공지 제목을 입력해주세요'), '새 공지')
  await user.type(screen.getByPlaceholderText('공지 내용을 입력해주세요'), '본문 내용')
}

/** 크기만 큰 파일 — 실제로 28MB 를 만들지 않는다 */
const sizedFile = (name: string, size: number) => {
  const file = new File(['x'], name)
  Object.defineProperty(file, 'size', { value: size })
  return file
}

beforeEach(() => {
  resetNoticeStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

describe('NoticeForm — 입력', () => {
  it('제목/본문 미입력 시 zod 에러 노출', async () => {
    renderForm()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('제목을 입력해주세요.')).toBeInTheDocument()
    expect(await screen.findByText('본문을 입력해주세요.')).toBeInTheDocument()
  })

  it('공백만 입력하면 거부한다', async () => {
    renderForm()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('공지 제목을 입력해주세요'), '   ')
    await user.type(screen.getByPlaceholderText('공지 내용을 입력해주세요'), '   ')
    await user.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('제목을 입력해주세요.')).toBeInTheDocument()
  })

  it('작성 폼은 상단 고정 해제로 열고 앱 푸시 체크박스가 없다', () => {
    renderForm()
    expect(screen.getByRole('checkbox', { name: '상단 고정' })).not.toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /앱 푸시/ })).not.toBeInTheDocument()
  })

  it('기존 공지 값으로 필드 프리필(상단 고정 포함)', () => {
    renderForm({ notice: { title: '기존 공지 제목', description: '기존 공지 본문', isPin: true } })

    expect(screen.getByDisplayValue('기존 공지 제목')).toBeInTheDocument()
    expect(screen.getByDisplayValue('기존 공지 본문')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '상단 고정' })).toBeChecked()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })
})

describe('NoticeForm — 첨부 선택', () => {
  it('고른 파일이 목록에 나오고 개별 제거된다', async () => {
    renderForm()
    const user = userEvent.setup()
    await user.upload(screen.getByLabelText('첨부 파일 선택'), [
      new File(['a'], 'a.png'),
      new File(['b'], 'b.pdf'),
    ])
    expect(screen.getByText('a.png')).toBeInTheDocument()
    expect(screen.getByText('b.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'a.png 제거' }))
    expect(screen.queryByText('a.png')).not.toBeInTheDocument()
  })

  it('허용 밖 확장자는 빼고 알린다', async () => {
    renderForm()
    // accept 를 우회해 고른 경우(드래그 등)도 막는지 본다
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(screen.getByLabelText('첨부 파일 선택'), [
      new File(['a'], 'ok.png'),
      new File(['b'], 'bad.exe'),
    ])
    expect(screen.getByText('ok.png')).toBeInTheDocument()
    expect(screen.queryByText('bad.exe')).not.toBeInTheDocument()
    expect(screen.getByText(/올릴 수 없는 형식입니다: bad.exe/)).toBeInTheDocument()
  })

  it('합계 28MB 를 넘기면 이번 선택을 받지 않는다', async () => {
    renderForm()
    const user = userEvent.setup()
    const input = screen.getByLabelText('첨부 파일 선택')
    await user.upload(input, sizedFile('a.pdf', 20 * 1024 * 1024))
    await user.upload(input, sizedFile('b.pdf', 9 * 1024 * 1024))

    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.queryByText('b.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('첨부 파일은 합계 28MB까지 올릴 수 있습니다.')).toBeInTheDocument()
  })
})

describe('NoticeForm — 작성 제출', () => {
  it('multipart 필드를 swagger 이름으로 보내고, 성공하면 닫고 목록에 나온다', async () => {
    const sent: [string, string][] = []
    server.use(
      http.post(ADD_NOTICE_PATH, async ({ request }) => {
        const form = await request.clone().formData()
        for (const [key, value] of form.entries()) {
          sent.push([key, typeof value === 'string' ? value : value.name])
        }
        // 기록만 하고 실제 처리는 기본 핸들러(상태 보유)에 넘긴다
        return undefined
      })
    )

    const { onSuccess } = renderForm()
    const user = userEvent.setup()
    await fill(user)
    await user.click(screen.getByRole('checkbox', { name: '상단 고정' }))
    await user.upload(screen.getByLabelText('첨부 파일 선택'), new File(['a'], 'a.png'))
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(sent).toEqual([
      ['siteSeq', '7'],
      ['title', '새 공지'],
      ['description', '본문 내용'],
      ['isPin', 'true'],
      ['file', 'a.png'],
    ])
    const { items } = await fetchNoticeList({ siteSeq: 7, pageNumber: 1, pageSize: 100 })
    expect(items[0]).toMatchObject({ title: '새 공지', isPin: true, attachCount: 1 })
  })

  it('실패하면 닫지 않고 입력이 남는다', async () => {
    server.use(
      http.post(ADD_NOTICE_PATH, () =>
        HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: 400 }, { status: 400 })
      )
    )
    const { onSuccess } = renderForm()
    const user = userEvent.setup()
    await fill(user)
    await user.click(screen.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '등록' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()
    expect(screen.getByDisplayValue('새 공지')).toBeInTheDocument()
  })

  it('처리 중에는 버튼이 잠겨 연타해도 한 번만 보낸다', async () => {
    let calls = 0
    server.use(
      http.post(ADD_NOTICE_PATH, async () => {
        calls += 1
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ message: 'ok', data: true, code: 200 })
      })
    )
    const { onSuccess } = renderForm()
    const user = userEvent.setup()
    await fill(user)
    const submit = screen.getByRole('button', { name: '등록' })
    await user.click(submit)
    await user.click(submit)

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(calls).toBe(1)
  })
})
