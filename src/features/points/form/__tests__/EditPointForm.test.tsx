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

  it('🔴 인증수단 선택이 **있다** — 서버가 authMethod 없이는 TAG ID 를 처리하지 않는다', () => {
    // 029 에서 뺐다가 2026-10-15 되돌렸다. ⚠️ 상세 카드 스위치와 중복이고, 나중에
    // 한쪽을 뺀다(사용자 결정).
    renderForm()

    expect(screen.getByRole('button', { name: /^QR$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^NFC$/ })).toBeInTheDocument()
  })

  it('🔴 TAG ID 필드는 **NFC 를 고를 때만** 뜬다 — 기준이 서버값에서 폼 값으로 바뀌었다', async () => {
    const user = userEvent.setup()
    renderForm(detail({ authMethod: 9, authMethodName: 'QR' }))
    expect(screen.queryByPlaceholderText('14자리 HEX')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^NFC$/ }))
    expect(screen.getByPlaceholderText('14자리 HEX')).toBeInTheDocument()
  })

  it('🔴 QR 지점에 남아 있던 TAG ID 가 NFC 를 고르면 채워져 있다 (사용자 결정 2026-10-15)', async () => {
    // 같은 태그를 다시 쓰는 경우가 많다. QR 상태에서는 입력란이 없어 노출되지 않는다
    const user = userEvent.setup()
    renderForm(detail({ authMethod: 9, authMethodName: 'QR', nfcTagId: '04A1B2C3D4E5F6' }))

    await user.click(screen.getByRole('button', { name: /^NFC$/ }))
    expect(screen.getByPlaceholderText('14자리 HEX')).toHaveValue('04A1B2C3D4E5F6')
  })
})

describe('EditPointForm — PATCH 전송', () => {
  it('🔴 authMethod 를 **항상** 보낸다 — 없으면 서버가 nfcTagId 를 무시한다 (재측정 2026-10-15)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    const name = screen.getByPlaceholderText('지점명을 입력해주세요')
    await user.clear(name)
    await user.type(name, '정문 입구(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    // 🔴 `authMethod` 가 없으면 서버가 `nfcTagId` 를 **무시하면서 200** 을 준다.
    //    과거 400 은 `authMethod: 10` 을 **TAG ID 없이** 보낸 경우였고, NFC 일 때는
    //    아래 케이스처럼 태그를 항상 동봉하므로 그 경계에 걸리지 않는다
    expect(captured[0]).toEqual({
      pointSeq: 1,
      name: '정문 입구(수정)',
      memo: '정문 CCTV 앞',
      authMethod: 9, // QR
      nfcTagId: undefined, // QR 이라 보내지 않는다 — 서버가 남은 값을 지울 수단이 없다
      useYn: true,
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

  it('🔴 NFC 는 authMethod 10 + TAG ID 를 함께 보낸다 — 태그 교체 경로다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm(detail({ authMethod: 10, authMethodName: 'NFC', nfcTagId: '04A1B2C3D4E5F6' }))

    const tag = screen.getByPlaceholderText('14자리 HEX')
    await user.clear(tag)
    await user.type(tag, 'AABBCCDDEEFF11')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].nfcTagId).toBe('AABBCCDDEEFF11')
    expect(captured[0].authMethod).toBe(10)
  })

  it('🔴 QR → NFC 로 바꿔 저장하면 수단과 태그가 함께 간다 — 확인 모달 없이 저장한다', async () => {
    // 수단 변경을 별도 확인 없이 [저장] 한 번으로 반영한다(사용자 결정 2026-10-15).
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm(detail({ authMethod: 9, authMethodName: 'QR' }))

    await user.click(screen.getByRole('button', { name: /^NFC$/ }))
    await user.type(screen.getByPlaceholderText('14자리 HEX'), 'AABBCCDDEEFF11')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].authMethod).toBe(10)
    expect(captured[0].nfcTagId).toBe('AABBCCDDEEFF11')
  })

  it('🔴 NFC 를 골랐는데 TAG ID 가 비어 있으면 보내지 않는다 — 서버 400 전에 막는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm(detail({ authMethod: 9, authMethodName: 'QR' }))

    await user.click(screen.getByRole('button', { name: /^NFC$/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByText('NFC TAG ID를 입력해주세요.')).toBeInTheDocument())
    expect(captured).toHaveLength(0)
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
