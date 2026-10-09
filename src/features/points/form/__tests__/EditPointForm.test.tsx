import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EditPointForm from '../EditPointForm'
import { server } from '@/mocks/server'
import { resetPointStore } from '@/mocks/handlers/points'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'
import type { PointDetail } from '../../types'

/**
 * 지점 수정 — `spec 022` Phase 5.
 *
 * 🔴 **두 가지가 여기서 고정된다.** ① 상세 값이 `defaultValues` 로 들어온다(022 전까지는
 * 빈 폼이었다) ② `pointSeq` 가 **모달이 열린 시점의 값으로 고정**된다 — 고정되지 않으면
 * 수정 중 다른 지점을 선택했을 때 저장이 엉뚱한 지점에 적용된다.
 */

const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

const detail = (overrides: Partial<PointDetail> = {}): PointDetail => ({
  pointSeq: 1,
  name: '정문 입구',
  memo: '정문 CCTV 앞',
  authMethod: 9,
  authMethodName: 'QR',
  qrCode: 'STSP1:7:1:1760000000:mockSignature',
  nfcTagId: null,
  gpsLat: null,
  gpsLng: null,
  useYn: true,
  lastPatrolDt: '2026-10-02T09:11:00',
  lastPatrolUserSeq: 101,
  lastPatrolUserName: '김근무',
  courseList: [{ courseSeq: 1, courseName: 'A동 순찰코스' }],
  ...overrides,
})

const renderForm = (point = detail(), onSuccess = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <EditPointForm point={point} onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  /** prop 만 바꿔 다시 렌더한다 — 모달이 열린 채 뒤쪽 목록에서 다른 지점을 고른 상황 */
  const rerenderWith = (next: PointDetail) =>
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <EditPointForm point={next} onSuccess={onSuccess} />
      </QueryClientProvider>
    )
  return { onSuccess, rerenderWith }
}

/** PATCH 바디를 수집하는 핸들러를 끼운다 */
const captureBody = () => {
  const captured: Record<string, unknown>[] = []
  server.use(
    http.patch(UPDATE_POINT_PATH, async ({ request }) => {
      captured.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ message: '요청을 정상 처리하였습니다.', data: null, code: 200 })
    })
  )
  return captured
}

beforeEach(() => {
  resetPointStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('EditPointForm — 초기값 주입', () => {
  it('🔴 상세 값으로 채워져 열린다 — 빈 폼이 아니다', () => {
    renderForm()

    expect(screen.getByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구')
    expect(screen.getByPlaceholderText('설명을 입력해주세요')).toHaveValue('정문 CCTV 앞')
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('NFC 지점이면 TAG ID 입력이 값과 함께 열린다', () => {
    renderForm(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: '04A1B2C3D4E5F6' }))

    expect(screen.getByPlaceholderText('14자리 HEX')).toHaveValue('04A1B2C3D4E5F6')
  })

  it('설명이 null 이면 빈 문자열로 연다', () => {
    renderForm(detail({ memo: null }))

    expect(screen.getByPlaceholderText('설명을 입력해주세요')).toHaveValue('')
  })

  it('🔴 미실측 인증수단 코드면 아무것도 선택하지 않은 상태로 연다', async () => {
    // 임의로 'QR' 을 채우면 사용자가 고르지 않은 인증수단으로 저장된다(A1).
    const user = userEvent.setup()
    const captured = captureBody()
    // 서버는 null 을 `''` 또는 `'Unknown'` 으로 준다(B-6) — 타입은 `string` 이다
    renderForm(detail({ authMethod: 99, authMethodName: '' }))

    await user.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('인증수단을 선택해주세요.')).toBeInTheDocument()
    expect(captured).toHaveLength(0)
  })
})

describe('EditPointForm — PATCH 전송', () => {
  it('pointSeq · reissueQrYn: false 를 담아 전량 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    const name = screen.getByPlaceholderText('지점명을 입력해주세요')
    await user.clear(name)
    await user.type(name, '정문 입구(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toEqual({
      pointSeq: 1,
      name: '정문 입구(수정)',
      memo: '정문 CCTV 앞',
      authMethod: 9, // 🔴 'QR' 이 아니라 정수다
      nfcTagId: null,
      useYn: true,
      reissueQrYn: false, // QR 재발급은 범위 외 — 생략하지 않고 명시적으로 false
    })
  })

  it('지점사용을 끄면 useYn false 로 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].useYn).toBe(false)
  })

  it('QR 로 바꾸면 nfcTagId 를 null 로 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: '04A1B2C3D4E5F6' }))

    await user.click(screen.getByRole('button', { name: /QR/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].authMethod).toBe(9)
    expect(captured[0].nfcTagId).toBeNull()
  })

  it('🔴 모달이 열린 뒤 다른 지점이 선택돼도 pointSeq 는 바뀌지 않는다', async () => {
    // 고정하지 않으면 저장이 엉뚱한 지점에 적용된다(§4).
    const user = userEvent.setup()
    const captured = captureBody()
    const { rerenderWith } = renderForm()

    rerenderWith(detail({ pointSeq: 5, name: '로비 1층' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].pointSeq).toBe(1)
    expect(captured[0].name).toBe('정문 입구')
  })
})

describe('EditPointForm — 성공·실패 후 모달', () => {
  it('성공하면 onSuccess 를 부른다 (부모가 닫는다)', async () => {
    const user = userEvent.setup()
    captureBody()
    const { onSuccess } = renderForm()

    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('🔴 실패하면 onSuccess 를 부르지 않는다 — 입력값이 사라지면 안 된다', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(UPDATE_POINT_PATH, () =>
        HttpResponse.json({ message: '서버 오류입니다.', data: null, code: 500 }, { status: 500 })
      )
    )
    const { onSuccess } = renderForm()

    const name = screen.getByPlaceholderText('지점명을 입력해주세요')
    await user.clear(name)
    await user.type(name, '정문 입구(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()
    expect(name).toHaveValue('정문 입구(수정)')
  })
})
