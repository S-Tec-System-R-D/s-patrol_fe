import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AddPointForm from '../AddPointForm'
import { server } from '@/mocks/server'
import { resetPointStore } from '@/mocks/handlers/points'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * 지점 추가 — `spec 022` Phase 4.
 *
 * 전송 바디를 직접 가로채 검증한다. 🔴 `siteSeq`(spec 021 값) · `useYn`(DTO required) ·
 * **정수 `authMethod`** 셋 중 하나라도 빠지면 서버가 거부하거나 엉뚱한 사업장에 들어간다.
 */

const ADD_POINT_PATH = '/api/v1/Point/W/sign/AddPoint'

const renderForm = (onSuccess = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AddPointForm onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  return { onSuccess }
}

/** 전송 바디를 수집하는 핸들러를 끼운다 */
const captureBody = () => {
  const captured: Record<string, unknown>[] = []
  server.use(
    http.post(ADD_POINT_PATH, async ({ request }) => {
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

describe('AddPointForm — 검증', () => {
  it('이름이 짧으면 제출되지 않는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '정')
    await user.click(screen.getByRole('button', { name: '생성' }))

    expect(await screen.findByText('두 글자 이상 입력해주세요.')).toBeInTheDocument()
    expect(captured).toHaveLength(0)
  })

  it('NFC인데 TAG ID가 비면 그 필드에 메시지가 뜬다', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '로비 1층')
    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.click(screen.getByRole('button', { name: '생성' }))

    expect(await screen.findByText('NFC TAG ID를 입력해주세요.')).toBeInTheDocument()
  })

  it('🔴 NFC TAG ID가 14자리 HEX가 아니면 그 필드에 메시지가 뜬다', async () => {
    // 022 전까지는 이 메시지가 `errors.name` 자리에 묶여 **화면에 뜨지 않았다**(복붙 결함).
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '로비 1층')
    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.type(screen.getByPlaceholderText('14자리 HEX'), 'ZZZ')
    await user.click(screen.getByRole('button', { name: '생성' }))

    expect(
      await screen.findByText('14자리 HEX로 입력해주세요. (예: 04A1B2C3D4E5F6)')
    ).toBeInTheDocument()
  })
})

describe('AddPointForm — 전송', () => {
  it('siteSeq · useYn · 정수 authMethod를 담아 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '정문 입구')
    await user.type(screen.getByPlaceholderText('설명을 입력해주세요'), '정문 CCTV 앞')
    await user.click(screen.getByRole('button', { name: '생성' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toEqual({
      siteSeq: 7,
      name: '정문 입구',
      memo: '정문 CCTV 앞',
      authMethod: 9, // 🔴 'QR' 이 아니라 정수다
      nfcTagId: null,
      useYn: true,
    })
  })

  it('지점사용을 끄면 useYn false로 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '외벽 북측')
    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('button', { name: '생성' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].useYn).toBe(false)
  })

  it('NFC 선택 시 TAG ID와 authMethod 10을 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '로비 1층')
    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.type(screen.getByPlaceholderText('14자리 HEX'), '04A1B2C3D4E5F6')
    await user.click(screen.getByRole('button', { name: '생성' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].authMethod).toBe(10)
    expect(captured[0].nfcTagId).toBe('04A1B2C3D4E5F6')
  })

  it('설명이 비면 memo를 null로 보낸다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '비상구 A')
    await user.click(screen.getByRole('button', { name: '생성' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].memo).toBeNull()
  })
})

describe('AddPointForm — 성공·실패 후 모달', () => {
  it('성공하면 onSuccess를 부른다 (부모가 닫는다)', async () => {
    const user = userEvent.setup()
    captureBody()
    const { onSuccess } = renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '정문 입구')
    await user.click(screen.getByRole('button', { name: '생성' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('🔴 실패하면 onSuccess를 부르지 않는다 — 입력값이 사라지면 안 된다', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(ADD_POINT_PATH, () =>
        HttpResponse.json({ message: '서버 오류입니다.', data: null, code: 500 }, { status: 500 })
      )
    )
    const { onSuccess } = renderForm()

    await user.type(screen.getByPlaceholderText('지점명을 입력해주세요'), '정문 입구')
    await user.click(screen.getByRole('button', { name: '생성' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '생성' })).toBeEnabled())
    expect(onSuccess).not.toHaveBeenCalled()
    // 입력값이 그대로 남아 있어야 다시 시도할 수 있다
    expect(screen.getByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구')
  })

  it('사업장이 선택되지 않았으면 제출 버튼이 막힌다', async () => {
    clearTokens() // siteSeq 도 함께 지워진다(spec 021 DoD #9)
    renderForm()

    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled()
    expect(
      screen.getByText('사업장이 선택되지 않아 지점을 추가할 수 없습니다.')
    ).toBeInTheDocument()
  })
})
