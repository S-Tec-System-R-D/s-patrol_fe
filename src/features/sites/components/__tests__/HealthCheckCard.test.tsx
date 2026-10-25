import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { notify } from '@/lib/notify'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { useSiteDetail } from '../../hooks/useSiteDetail'
import HealthCheckCard from '../HealthCheckCard'

/**
 * 헬스체크 카드 · 설정 폼 (`spec 044` T810) — 상세를 다시 받아 그리는지까지 본다(비옵티미스틱).
 *
 * 시드: 3 = 사용(30분 · 1 · 0회 · 08:16–23:16 · 예외 없음) / 4 = 사용(예외 2: 12:30–12:40)
 * / 9 = 값 없음(최소 생성) · 미사용 / 11 = 값 있음 · 미사용.
 */

const UPDATE_PATH = '/api/v1/Site/W/sign/UpdateSite'

const Harness = ({ siteSeq }: { siteSeq: number }) => {
  const detail = useSiteDetail(siteSeq)
  return detail.data ? <HealthCheckCard detail={detail.data} /> : null
}

const renderCard = (siteSeq: number) => {
  // 🔴 실패 토스트는 전역 `MutationCache.onError` 몫이다 — 테스트 클라이언트에도 같은 것을 단다
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    mutationCache: new MutationCache({ onError: (err) => notify.error((err as Error).message) }),
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness siteSeq={siteSeq} />
    </QueryClientProvider>
  )
}

const captureUpdates = () => {
  const bodies: unknown[] = []
  server.events.on('request:start', async ({ request }) => {
    if (new URL(request.url).pathname === UPDATE_PATH) bodies.push(await request.clone().json())
  })
  return bodies
}

const toggle = () => screen.getByRole('switch', { name: '헬스체크 사용' })
const setTime = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } })

const openEdit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '수정' }))
  return within(await screen.findByRole('dialog'))
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
})

afterEach(() => {
  server.events.removeAllListeners()
  vi.restoreAllMocks()
})

describe('HealthCheckCard — 표시', () => {
  it('5칸(HH:mm · 예외 여러 줄 · 타임아웃은 숫자만) · 사용 뱃지', async () => {
    renderCard(4)
    expect(await screen.findByText('사용 · 30분')).toBeInTheDocument()
    const values = within(screen.getByTestId('health-check-values'))
    expect(values.getByText('11:10 – 16:00')).toBeInTheDocument()
    expect(values.getByText('12:30 – 12:40')).toBeInTheDocument()
    expect(values.getByText('30분')).toBeInTheDocument()
    expect(values.getByText('2')).toBeInTheDocument()
    expect(values.getByText('5회')).toBeInTheDocument()
  })

  it('미사용이면 값을 흐리게 · [수정] 막힘 · 값 없는 칸은 -', async () => {
    renderCard(9)
    expect(await screen.findByText('미사용')).toBeInTheDocument()
    expect(screen.getByTestId('health-check-values')).toHaveClass('opacity-50')
    expect(screen.getByRole('button', { name: '수정' })).toBeDisabled()
    expect(within(screen.getByTestId('health-check-values')).getAllByText('-')).toHaveLength(4)
  })
})

describe('HealthCheckCard — 토글', () => {
  it('🔴 값이 있으면 켜기 = healthCheckYn 만 → 다시 받아 사용', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(11)
    await screen.findByText('미사용')
    await user.click(toggle())

    expect(await screen.findByText('사용 · 1분')).toBeInTheDocument()
    expect(bodies).toEqual([{ siteSeq: 11, healthCheckYn: true }])
  })

  it('🔴 끄기 = healthCheckYn: false 만 · 값은 남는다', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(3)
    await screen.findByText('사용 · 30분')
    await user.click(toggle())

    expect(await screen.findByText('미사용')).toBeInTheDocument()
    expect(bodies).toEqual([{ siteSeq: 3, healthCheckYn: false }])
    expect(within(screen.getByTestId('health-check-values')).getByText('30분')).toBeInTheDocument()
  })

  it('🔴 값이 비었으면 켜기 = 저장 없이 모달 · 취소하면 꺼진 채', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(9)
    await screen.findByText('미사용')
    await user.click(toggle())

    const dialog = within(await screen.findByRole('dialog'))
    expect(dialog.getByLabelText('체크 주기')).toHaveValue('') // 0 을 채우지 않는다
    await user.click(dialog.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toggle()).not.toBeChecked()
    expect(bodies).toEqual([])
  })

  it('🔴 값이 빈 사업장을 모달로 켠다 — 바디 전량(시각 HH:mm:00 · 새 예외 0)', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(9)
    await screen.findByText('미사용')
    await user.click(toggle())
    const dialog = within(await screen.findByRole('dialog'))

    setTime(dialog.getByLabelText('사용 시작'), '22:00')
    setTime(dialog.getByLabelText('사용 종료'), '06:00') // 자정 넘김 허용
    await user.type(dialog.getByLabelText('체크 주기'), '60')
    await user.type(dialog.getByLabelText('타임아웃'), '5')
    await user.type(dialog.getByLabelText('반복 횟수'), '0')
    await user.click(dialog.getByRole('button', { name: '예외 시간 추가' }))
    setTime(dialog.getByLabelText('예외 1 시작'), '00:00')
    setTime(dialog.getByLabelText('예외 1 종료'), '00:30')
    await user.click(dialog.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('사용 · 60분')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bodies).toEqual([
      {
        siteSeq: 9,
        healthCheckYn: true,
        healthCheckInterval: 60,
        healthCheckTimeout: 5,
        healthCheckRetry: 0,
        healthCheckStartTime: '22:00:00',
        healthCheckEndTime: '06:00:00',
        exceptionTime: [{ detailSeq: 0, exceptionStartTime: '00:00:00', exceptionEndTime: '00:30:00' }],
      },
    ])
  })
})

describe('HealthCheckForm — 검증 · 예외 바디', () => {
  it('시작 = 종료 · 주기 0 · 예외 시작 = 종료 → 요청하지 않는다', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(3)
    await screen.findByText('사용 · 30분')
    const dialog = await openEdit(user)

    setTime(dialog.getByLabelText('사용 종료'), '08:16')
    await user.clear(dialog.getByLabelText('체크 주기'))
    await user.type(dialog.getByLabelText('체크 주기'), '0')
    await user.click(dialog.getByRole('button', { name: '예외 시간 추가' }))
    setTime(dialog.getByLabelText('예외 1 시작'), '12:00')
    setTime(dialog.getByLabelText('예외 1 종료'), '12:00')
    await user.click(dialog.getByRole('button', { name: '저장' }))

    expect(await dialog.findAllByText('시작과 종료가 같을 수 없습니다.')).toHaveLength(2)
    expect(dialog.getByText('1 이상의 정수를 입력해주세요.')).toBeInTheDocument()
    expect(bodies).toEqual([])
  })

  it('🔴 기존 예외는 자기 detailSeq · 새 행은 0', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(4)
    await screen.findByText('사용 · 30분')
    const dialog = await openEdit(user)

    expect(dialog.getByLabelText('예외 1 시작')).toHaveValue('12:30')
    await user.click(dialog.getByRole('button', { name: '예외 시간 추가' }))
    setTime(dialog.getByLabelText('예외 2 시작'), '13:00')
    setTime(dialog.getByLabelText('예외 2 종료'), '13:10')
    await user.click(dialog.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      exceptionTime: [
        { detailSeq: 2, exceptionStartTime: '12:30:00', exceptionEndTime: '12:40:00' },
        { detailSeq: 0, exceptionStartTime: '13:00:00', exceptionEndTime: '13:10:00' },
      ],
    })
    expect(await screen.findByText('13:00 – 13:10')).toBeInTheDocument()
  })

  it('🔴 예외를 전부 지우면 exceptionTime: [] → 없음', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderCard(4)
    await screen.findByText('사용 · 30분')
    const dialog = await openEdit(user)

    await user.click(dialog.getByRole('button', { name: '예외 1 삭제' }))
    await user.click(dialog.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('없음')).toBeInTheDocument()
    expect(bodies[0]).toMatchObject({ exceptionTime: [] })
  })

  it('🔴 (D) 문자열 에러 → 그 문구로 토스트 · 모달 유지', async () => {
    const user = userEvent.setup()
    const error = vi.spyOn(notify, 'error')
    server.use(
      http.put(UPDATE_PATH, () => HttpResponse.json('간격은 필수입니다.', { status: 400 }), { once: true })
    )
    renderCard(3)
    await screen.findByText('사용 · 30분')
    const dialog = await openEdit(user)
    await user.click(dialog.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(error).toHaveBeenCalledWith('간격은 필수입니다.'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
