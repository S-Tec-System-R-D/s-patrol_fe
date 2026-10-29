import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { getSiteSeq, setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import ServiceLayout from '../ServiceLayout'

/**
 * 사업장 전환(`spec 061`) — 버튼 노출 · 모달 · 저장값 교체 · 홈 이동 · 현장 영역 재마운트 · 오버레이 해제 · 10초 상한.
 *
 * mock `UserSiteSelect`(`mocks/handlers/auth.ts`)는 토큰 `loginId` 로 갈린다 — `333333` = 루트 6 + 7 · 8(3개),
 * `555555` = 루트만(1개).
 *
 * 홈(`/zones`) 자리에 **조회를 손으로 끝내는 화면**을 둔다 — 오버레이가 "홈 첫 조회가 끝나면" 걷히는지 보려면
 * 조회가 끝나는 순간을 테스트가 정해야 한다.
 */

const USER_SITE_SELECT = '/api/v1/Login/W/sign/UserSiteSelect'
const requested: string[] = []
const pending: Array<() => void> = []

const ZonesProbe = () => {
  const seq = getSiteSeq()
  const { isSuccess } = useQuery({
    queryKey: ['probe', seq],
    queryFn: () => new Promise<number | null>((resolve) => pending.push(() => resolve(seq))),
  })
  return <p>{`홈 ${seq} ${isSuccess ? '로드됨' : '로딩'}`}</p>
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(6, '테스트 사업장2')
  requested.length = 0
  pending.length = 0
  server.events.on('request:start', ({ request }) => {
    requested.push(new URL(request.url).pathname)
  })
})

afterEach(() => {
  server.events.removeAllListeners()
  vi.useRealTimers()
})

const renderLayout = (initialPath: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ServiceLayout />}>
            <Route path="/zones" element={<ZonesProbe />} />
            <Route path="/points/:pointSeq" element={<p>지점 상세</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const rail = () => within(screen.getByRole('navigation', { name: '메뉴' }).parentElement!)
const floating = () => within(screen.getByRole('navigation', { name: '하단 메뉴' }))

/** 레일의 전환 버튼 → 모달 → 사업장 선택 */
const switchTo = async (siteName: string) => {
  const user = userEvent.setup()
  await user.click(await rail().findByRole('button', { name: '사업장 전환' }))
  const dialog = await screen.findByRole('dialog', { name: '사업장 전환' })
  await user.click(within(dialog).getByRole('button', { name: siteName }))
}

const finishProbe = () => act(() => pending.splice(0).forEach((resolve) => resolve()))

describe('ServiceLayout — 사업장 전환', () => {
  it('선택지 3개 — 레일 · floating nav 둘 다 버튼이 있고, 모달에 지금 사업장 표시', async () => {
    renderLayout('/points/12')
    const user = userEvent.setup()

    // 모달이 열리면 배경이 접근성 트리에서 빠진다 — floating nav 는 열기 전에 본다
    expect(await floating().findByRole('button', { name: '사업장 전환' })).toBeInTheDocument()
    await user.click(rail().getByRole('button', { name: '사업장 전환' }))

    const dialog = await screen.findByRole('dialog', { name: '사업장 전환' })
    const options = within(dialog).getAllByRole('button', { name: /테스트 사업장/ })
    expect(options.map((b) => b.textContent)).toEqual([
      '테스트 사업장2',
      '테스트 사업장2-1',
      '테스트 사업장2-2',
    ])
    expect(options[0]).toHaveAttribute('aria-current', 'true')
    expect(options[1]).not.toHaveAttribute('aria-current')
  })

  it('🔴 선택지 1개(555555)면 버튼이 없다', async () => {
    setAccessToken(makeAccessToken({ loginId: '555555' }))
    renderLayout('/points/12')

    await waitFor(() => expect(requested).toContain(USER_SITE_SELECT))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole('button', { name: '사업장 전환' })).not.toBeInTheDocument()
  })

  it('다른 사업장 → 저장값 교체 · 오버레이 · 홈 이동 · 홈 조회가 끝나면 오버레이 해제', async () => {
    renderLayout('/points/12')
    await switchTo('테스트 사업장2-1')

    expect(getSiteSeq()).toBe(7)
    expect(screen.getByRole('status')).toHaveTextContent('사업장 전환 중')
    expect(await screen.findByText('홈 7 로딩')).toBeInTheDocument()
    // 오버레이 아래는 `inert` — 키보드 포커스도 막힌다
    expect(screen.getByRole('navigation', { name: '하단 메뉴' }).closest('[inert]')).not.toBeNull()

    finishProbe()

    expect(await screen.findByText('홈 7 로드됨')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.getByRole('navigation', { name: '하단 메뉴' }).closest('[inert]')).toBeNull()
  })

  it('🔴 홈(/zones)에서 바꿔도 새 사업장으로 다시 그린다 — 같은 주소라도 재마운트', async () => {
    renderLayout('/zones')
    expect(await screen.findByText('홈 6 로딩')).toBeInTheDocument()
    finishProbe()
    expect(await screen.findByText('홈 6 로드됨')).toBeInTheDocument()

    await switchTo('테스트 사업장2-2')

    expect(await screen.findByText('홈 8 로딩')).toBeInTheDocument()
    finishProbe()
    expect(await screen.findByText('홈 8 로드됨')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })

  it('지금 사업장을 고르면 닫기만 한다 — 오버레이 · 이동 없음', async () => {
    renderLayout('/points/12')
    await switchTo('테스트 사업장2')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('지점 상세')).toBeInTheDocument()
    expect(getSiteSeq()).toBe(6)
  })

  it('🔴 홈 조회가 끝나지 않아도 10초 뒤 오버레이를 걷는다', async () => {
    // 상한 타이머가 전환 순간에 잡히므로 처음부터 가짜 시계 — 실제 시간도 흐르게 둬야 MSW · userEvent 가 돈다
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderLayout('/points/12')
    await switchTo('테스트 사업장2-1')
    expect(await screen.findByText('홈 7 로딩')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(9_000))
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1_000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
