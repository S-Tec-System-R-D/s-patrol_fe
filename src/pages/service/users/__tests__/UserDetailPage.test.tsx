import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetUserStore } from '@/mocks/handlers/users'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import { fetchUserDetail } from '@/features/workers/api/getUserDetail'
import { fetchUserList } from '@/features/workers/api/getUserList'
import { removeUser } from '@/features/workers/api/removeUser'
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
  resetUserStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
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

  it('정보 수정을 저장하면 모달이 닫히고 상세가 새 값으로 갱신된다 (spec 041 US2)', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '수정' }))
    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByDisplayValue('김민준')
    await user.clear(name)
    await user.type(name, '김민준2')
    await user.click(within(dialog).getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('heading', { name: '김민준2' })).toBeInTheDocument()
  })

  it('삭제를 확인하면 서버에서 지우고 목록으로 돌아간다 (spec 041 US4)', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /삭제|확인/ }))

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
    await expect(fetchUserDetail(101)).rejects.toBeTruthy()
    const { items } = await fetchUserList({ siteId: 7, pageNumber: 1, pageSize: 100 })
    expect(items.map((u) => u.userSeq)).not.toContain(101)
  })

  it('이미 지워진 근무자면 상세에 머물고 실패 화면으로 바뀐다', async () => {
    const user = userEvent.setup()
    renderAt('101')
    await screen.findByRole('heading', { name: '김민준' })
    // 다른 관리자가 먼저 지웠다
    await removeUser(101)

    await user.click(screen.getByRole('button', { name: '삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /삭제|확인/ }))

    expect(await screen.findByText(/불러오지 못했습니다/)).toBeInTheDocument()
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
  })

  it('🔴 본인 계정은 삭제 버튼이 잠긴다', async () => {
    setAccessToken(makeAccessToken({ userSeq: '109' }))
    renderAt('109')

    await screen.findByRole('heading', { name: '홍관리' })
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled()
  })

  it('비밀번호 변경은 정보 수정과 다른 모달이다 — loginPw 만 보내고 닫힌다 (spec 041 US3)', async () => {
    const sent: [string, string][] = []
    server.use(
      http.post('/api/v1/User/W/sign/UpdateUser', async ({ request }) => {
        const form = await request.clone().formData()
        for (const [key, value] of form.entries()) sent.push([key, String(value)])
        return undefined
      })
    )
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '비밀번호 변경' }))
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' })
    expect(within(dialog).queryByDisplayValue('김민준')).not.toBeInTheDocument()

    await user.type(within(dialog).getByPlaceholderText('8자리 이상, 영문·숫자·특수문자 포함'), 'Newpw12!')
    await user.type(within(dialog).getByPlaceholderText('한 번 더 입력해주세요'), 'Newpw12?')
    await user.click(within(dialog).getByRole('button', { name: '변경' }))
    expect(await within(dialog).findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()

    const confirm = within(dialog).getByPlaceholderText('한 번 더 입력해주세요')
    await user.clear(confirm)
    await user.type(confirm, 'Newpw12!')
    await user.click(within(dialog).getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(sent).toEqual([
      ['userSeq', '101'],
      ['loginPw', 'Newpw12!'],
    ])
  })

  it('비밀번호는 로그인과 같은 규칙이다', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await user.click(await screen.findByRole('button', { name: '비밀번호 변경' }))
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' })
    await user.type(within(dialog).getByPlaceholderText('8자리 이상, 영문·숫자·특수문자 포함'), '12')
    await user.click(within(dialog).getByRole('button', { name: '변경' }))

    expect(await within(dialog).findByText('8자리 이상 입력해주세요.')).toBeInTheDocument()
  })
})

describe('UserDetailPage — 최근 순찰 기록', () => {
  const HISTORY_PATH = '/api/v1/History/W/sign/GetPointHistory'

  it('🔴 선택 사업장 + userSeq 로 조회한다 — 이름 검색이 아니다(동명이인)', async () => {
    const calls: URL[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === HISTORY_PATH) calls.push(target)
    })
    renderAt('101')

    await screen.findByText('최근 순찰 기록')
    await screen.findAllByRole('link', { name: /\d{2}:\d{2}/ })
    const query = calls[calls.length - 1].searchParams
    expect(query.get('siteSeq')).toBe('7')
    expect(query.get('userSeq')).toBe('101')
    expect(query.get('userName')).toBeNull()
  })

  it('기록 행은 지점 인증 상세로 간다 · 전체 기록은 순찰자 필터를 건 목록으로 간다', async () => {
    renderAt('101')

    const rows = await screen.findAllByRole('link', { name: /\d{2}:\d{2}/ })
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThanOrEqual(8)
    expect(rows[0].getAttribute('href')).toMatch(/^\/patrol\/points\/\d+$/)
    expect(screen.getByRole('link', { name: '전체 기록' })).toHaveAttribute(
      'href',
      `/patrol/points?user=${encodeURIComponent('김민준')}`
    )
  })

  it('🔴 날짜별로 묶고 결과는 왼쪽 아이콘이 말한다 — 결과 글자 뱃지가 없다 (spec 049)', async () => {
    renderAt('101')

    await screen.findAllByRole('link', { name: /\d{2}:\d{2}/ })
    expect(screen.getAllByRole('heading', { level: 4, name: /^\d+월 \d+일 \(.\)/ }).length).toBeGreaterThan(0)
    // 시드 101: 미완료 · 완료(메모 없음) 행이 섞여 있다 — 5종 문구는 아이콘의 접근 이름으로 남는다
    expect(screen.getAllByRole('img', { name: '미완료' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('img', { name: '이상없음' }).length).toBeGreaterThan(0)
    expect(screen.queryByText('이상없음')).not.toBeInTheDocument()
    expect(screen.queryByText('미완료')).not.toBeInTheDocument()
  })

  it('🔴 기록 조회 실패는 "기록 없음" 이 아니다 — 상세 본문은 그대로 있다', async () => {
    server.use(http.get(HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderAt('101')

    expect(await screen.findByText('순찰 기록을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('순찰 기록이 없습니다')).not.toBeInTheDocument()
    expect(screen.getByText('기본정보')).toBeInTheDocument()
  })

  it('기록이 없으면 단정하지 않는 빈 상태', async () => {
    server.use(
      http.get(HISTORY_PATH, () =>
        HttpResponse.json({
          message: '',
          code: 200,
          data: { items: [], page: 1, pageSize: 8, totalCount: 0 },
        })
      )
    )
    renderAt('101')

    expect(await screen.findByText('순찰 기록이 없습니다')).toBeInTheDocument()
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
