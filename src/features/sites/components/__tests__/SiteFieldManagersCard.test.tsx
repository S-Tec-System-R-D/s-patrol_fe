import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { notify } from '@/lib/notify'
import { resetUserStore } from '@/mocks/handlers/users'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import SiteFieldManagersCard from '../SiteFieldManagersCard'

/**
 * 현장관리자 카드 (`spec 081`) — 목록 · 추가 · 정보 수정 · 비밀번호 변경 · 삭제.
 *
 * 근무자 MSW 시드: 사업장 7 = 현장 관리자 홍관리(109 · 사번 240109 · 010-1111-2222) + 근무자 8명 / 사업장 9 = 없음.
 */

const ADD_PATH = '/api/v1/User/W/sign/AddUser'

const renderCard = (siteSeq: number) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    mutationCache: new MutationCache({ onError: (err) => notify.error((err as Error).message) }),
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <SiteFieldManagersCard siteSeq={siteSeq} siteName="테스트 사업장2-1" />
    </QueryClientProvider>
  )
}

const captureAdds = () => {
  const bodies: Record<string, string>[] = []
  server.events.on('request:start', async ({ request }) => {
    if (new URL(request.url).pathname !== ADD_PATH) return
    const form = await request.clone().formData()
    bodies.push(Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)])))
  })
  return bodies
}

const rows = () => within(screen.getByRole('list', { name: '현장관리자' })).getAllByRole('listitem')

const openMenu = async (user: ReturnType<typeof userEvent.setup>, name: string, item: string) => {
  await user.click(await screen.findByRole('button', { name: `${name} 메뉴` }))
  await user.click(await screen.findByRole('menuitem', { name: item }))
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetUserStore()
})

afterEach(() => {
  server.events.removeAllListeners()
  vi.restoreAllMocks()
})

describe('SiteFieldManagersCard', () => {
  it('🔴 현장 관리자만 적는다 — 이름 · 사번 · 인원(근무자는 섞이지 않는다)', async () => {
    renderCard(7)

    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(rows()[0]).toHaveTextContent('홍관리')
    expect(rows()[0]).toHaveTextContent('240109')
    expect(screen.getByText('1명')).toBeInTheDocument()
    expect(screen.queryByText('김민준')).not.toBeInTheDocument()
  })

  it('없으면 빈 상태 — 추가해야 현장에 로그인할 수 있다고 알린다', async () => {
    renderCard(9)

    expect(await screen.findByText('현장관리자가 없습니다')).toBeInTheDocument()
    expect(screen.getByText('현장관리자를 추가해야 현장 사이트에 로그인할 수 있습니다.')).toBeInTheDocument()
  })

  it('🔴 추가 — 보고 있는 사업장 · 권한 6(현장 관리자)으로 보내고 목록에 나타난다', async () => {
    const user = userEvent.setup()
    const adds = captureAdds()
    renderCard(9)
    await screen.findByText('현장관리자가 없습니다')

    await user.click(screen.getByRole('button', { name: '추가' }))
    const dialog = within(await screen.findByRole('dialog', { name: '현장관리자 추가' }))
    expect(dialog.getByLabelText('소속 사업장')).toHaveValue('테스트 사업장2-1')
    await user.type(dialog.getByLabelText(/^이름/), '새관리')
    await user.type(dialog.getByLabelText(/^연락처/), '010-8101-8101')
    await user.type(dialog.getByLabelText(/^사번/), '8101810')
    await user.type(dialog.getByLabelText(/^초기 비밀번호/), 'test1234!')
    await user.type(dialog.getByLabelText(/^비밀번호 확인/), 'test1234!')
    await user.click(dialog.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(rows()).toHaveLength(1))
    expect(rows()[0]).toHaveTextContent('새관리')
    expect(rows()[0]).toHaveTextContent('8101810')
    expect(adds[0]).toMatchObject({ siteSeq: '9', codeSeq: '6', loginId: '8101810', name: '새관리', phone: '01081018101' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('🔴 정보 수정 — 연락처는 목록에 없어 상세에서 채운다 · 저장하면 이름이 바뀐다', async () => {
    const user = userEvent.setup()
    renderCard(7)

    await openMenu(user, '홍관리', '정보 수정')
    const dialog = within(await screen.findByRole('dialog', { name: '현장관리자 수정' }))
    expect(await dialog.findByDisplayValue('010-1111-2222')).toBeInTheDocument()
    const name = dialog.getByDisplayValue('홍관리')
    await user.clear(name)
    await user.type(name, '홍수정')
    await user.click(dialog.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(rows()[0]).toHaveTextContent('홍수정'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('비밀번호 변경 — 새 비밀번호를 지정하고 닫힌다', async () => {
    const user = userEvent.setup()
    renderCard(7)

    await openMenu(user, '홍관리', '비밀번호 변경')
    const dialog = within(await screen.findByRole('dialog', { name: '비밀번호 변경' }))
    await user.type(dialog.getByLabelText(/^새 비밀번호$|^새 비밀번호\s*\*/), 'next1234!')
    await user.type(dialog.getByLabelText(/^새 비밀번호 확인/), 'next1234!')
    await user.click(dialog.getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('삭제 — 확인하면 목록에서 빠지고 빈 상태가 된다', async () => {
    const user = userEvent.setup()
    renderCard(7)

    await openMenu(user, '홍관리', '삭제')
    const confirm = within(await screen.findByRole('alertdialog'))
    expect(confirm.getByText(/홍관리\(240109\)/)).toBeInTheDocument()
    await user.click(confirm.getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('현장관리자가 없습니다')).toBeInTheDocument()
  })
})
