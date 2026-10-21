import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import UserDetailPage from '../UserDetailPage'

/**
 * `/users/:userSeq` 근무자 상세 — `spec 038` US2 에서 **신설**했다(전에는 우측 패널).
 * 시드(`mocks/handlers/users.ts`): 101 김민준(근무 중) · 102 이서연(근무 종료).
 */

const DETAIL_PATH = '/api/v1/User/W/sign/UserDetail'

const renderAt = (userSeq: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/users/${userSeq}`]}>
        <Routes>
          <Route path="/users" element={<div>LIST_ROUTE</div>} />
          <Route path="/users/:userSeq" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const captureDetailCalls = () => {
  const calls: URL[] = []
  server.events.on('request:start', ({ request }) => {
    const target = new URL(request.url)
    if (target.pathname === DETAIL_PATH) calls.push(target)
  })
  return calls
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
})

afterEach(() => {
  clearTokens()
  server.events.removeAllListeners()
})

describe('UserDetailPage — 정상', () => {
  it('머리(이름·근무 상태)와 기본정보(사번·연락처·소속·근무 상태)를 그린다', async () => {
    renderAt('101')

    expect(await screen.findByRole('heading', { name: '김민준' })).toBeInTheDocument()
    expect(screen.getByText('기본정보')).toBeInTheDocument()
    expect(screen.getByText('240101')).toBeInTheDocument()
    expect(screen.getByText('강동 테크노타워')).toBeInTheDocument()
    expect(screen.getAllByText('근무 중').length).toBeGreaterThan(0)
  })

  it('🔴 머리에 부제가 없다 — 값은 카드에만 있다 (같은 말을 두 번 하지 않는다)', async () => {
    renderAt('101')

    await screen.findByRole('heading', { name: '김민준' })
    expect(screen.queryByText(/240101 ·/)).not.toBeInTheDocument()
    expect(screen.getAllByText('240101')).toHaveLength(1)
  })

  it('🔴 상세는 서버 이름 userId 로 요청한다 (B-12)', async () => {
    const calls = captureDetailCalls()
    renderAt('101')

    await screen.findByRole('heading', { name: '김민준' })
    expect(calls[0].searchParams.get('userId')).toBe('101')
    expect(calls[0].searchParams.get('userSeq')).toBeNull()
  })

  it('🔴 연락처는 하이픈 형식으로 보인다 — 서버는 하이픈 없이 준다', async () => {
    renderAt('101')

    expect(await screen.findByText('010-2345-6789')).toBeInTheDocument()
  })

  it('🔴 권한·등록일·배치 이력이 없다 — 상세 응답에 없고(OQ-8) 이력은 미개발이다', async () => {
    renderAt('101')

    await screen.findByRole('heading', { name: '김민준' })
    expect(screen.queryByText('권한')).not.toBeInTheDocument()
    expect(screen.queryByText('등록일')).not.toBeInTheDocument()
    expect(screen.queryByText(/배치 변경 이력/)).not.toBeInTheDocument()
  })

  it('근무 종료를 그린다', async () => {
    renderAt('102')

    await screen.findByRole('heading', { name: '이서연' })
    expect(screen.getAllByText('근무 종료').length).toBeGreaterThan(0)
  })

  it('수정 모달이 서버 값으로 채워진다', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '수정' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByDisplayValue('김민준')).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue('010-2345-6789')).toBeInTheDocument()
  })

  it('삭제를 확인하면 목록으로 돌아간다 (mock)', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /삭제|확인/ }))

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
  })

  it('비밀번호 확인 모달을 연다', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '비밀번호' }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
  })
})

describe('UserDetailPage — 상태 분기', () => {
  it('🔴 주소가 숫자가 아니면 요청 없이 즉시 오류 — 스켈레톤이 남지 않는다', () => {
    const calls = captureDetailCalls()
    renderAt('abc')

    expect(screen.getByText('주소가 올바르지 않습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /근무자 목록으로/ })).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('🔴 403(현장관리자, B-41)은 조회 실패 — 다시 시도·목록으로를 준다', async () => {
    server.use(http.get(DETAIL_PATH, () => new HttpResponse(null, { status: 403 })))
    renderAt('101')

    expect(await screen.findByText('근무자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /근무자 목록으로/ })).toBeInTheDocument()
  })

  it('없는 근무자도 같은 실패 화면이다', async () => {
    renderAt('999')

    expect(await screen.findByText('근무자를 불러오지 못했습니다')).toBeInTheDocument()
  })
})
