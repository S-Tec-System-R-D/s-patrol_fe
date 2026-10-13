import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/server'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { makeAccessToken } from '@/test/jwt'

import PointCredentialSwitch from '../PointCredentialSwitch'
import type { UpdatePointRequest } from '../../../types'

/**
 * 인증수단 전환 (`spec 029` T433).
 *
 * 🔴 **이 파일이 지키는 것은 "서버에 없는 경로를 만들지 않았다" 는 사실이다.**
 * `authMethod: 10` 은 `nfcTagId` 없이 보내면 **400** 이다(WF-1-0 실측 2026-10-13) —
 * 화면 어디를 눌러도 그 요청이 나가지 않아야 한다.
 */

const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

/** 나간 요청 바디를 가로챈다 — 화면이 아니라 **전송된 것**을 본다 */
const captureBody = () => {
  const captured: Partial<UpdatePointRequest>[] = []
  server.use(
    http.patch(UPDATE_POINT_PATH, async ({ request }) => {
      captured.push((await request.json()) as Partial<UpdatePointRequest>)
      return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
    })
  )
  return captured
}

const renderSwitch = (authMethod: number) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <PointCredentialSwitch pointSeq={1} authMethod={authMethod} />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
})

describe('PointCredentialSwitch — 현재 수단 표시', () => {
  it('현재 수단이 선택 상태이고, 다시 눌러도 요청이 나가지 않는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderSwitch(9)

    const qr = screen.getByRole('button', { name: /QR/ })
    expect(qr).toHaveAttribute('aria-pressed', 'true')
    expect(qr).toBeDisabled()

    await user.click(qr)
    expect(captured).toHaveLength(0)
  })

  it('선택된 쪽은 현재 상태를, 아닌 쪽은 바꾸면 필요한 것을 말한다', () => {
    renderSwitch(9)

    expect(screen.getByText('현재 사용 중')).toBeInTheDocument()
    expect(screen.getByText('태그 ID 등록 필요')).toBeInTheDocument()
  })
})

describe('PointCredentialSwitch — NFC → QR (확인만)', () => {
  it('확인 모달을 거쳐 authMethod 9 를 보낸다 — nfcTagId 는 보내지 않는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderSwitch(10)

    await user.click(screen.getByRole('button', { name: /QR/ }))
    expect(await screen.findByText('QR 인증으로 변경하시겠습니까?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '변경' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].authMethod).toBe(9)
    // 🔴 어차피 서버가 지우지 못한다(B-15). 보내 봐야 "지우려 했는데 안 지워진" 흔적만 남는다
    expect(captured[0].nfcTagId).toBeUndefined()
  })

  it('🔴 태그가 더는 통하지 않는다는 사실을 알린다', async () => {
    const user = userEvent.setup()
    renderSwitch(10)

    await user.click(screen.getByRole('button', { name: /QR/ }))

    expect(await screen.findByText(/등록된 NFC 태그로는 인증할 수 없습니다/)).toBeInTheDocument()
  })
})

describe('PointCredentialSwitch — QR → NFC (TAG ID 필수)', () => {
  it('🔴 TAG ID 없이는 요청이 나가지 않는다 — 서버에 없는 경로다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderSwitch(9)

    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.click(await screen.findByRole('button', { name: 'NFC로 변경' }))

    expect(await screen.findByText('NFC TAG ID를 입력해주세요.')).toBeInTheDocument()
    expect(captured).toHaveLength(0)
  })

  it('🔴 14자리 HEX 가 아니면 막는다 — 전환 모달도 같은 규칙을 쓴다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderSwitch(9)

    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.type(await screen.findByPlaceholderText('14자리 HEX'), 'ZZZ')
    await user.click(screen.getByRole('button', { name: 'NFC로 변경' }))

    expect(await screen.findByText(/14자리 HEX로 입력해주세요/)).toBeInTheDocument()
    expect(captured).toHaveLength(0)
  })

  it('TAG ID 를 넣으면 authMethod 10 과 **함께** 나간다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderSwitch(9)

    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.type(await screen.findByPlaceholderText('14자리 HEX'), '04A1B2C3D4E5F6')
    await user.click(screen.getByRole('button', { name: 'NFC로 변경' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toMatchObject({ pointSeq: 1, authMethod: 10, nfcTagId: '04A1B2C3D4E5F6' })
  })

  it('🔴 전환은 옵티미스틱이 아니다 — 응답이 와도 스위치는 prop 을 따른다', async () => {
    const user = userEvent.setup()
    captureBody()
    renderSwitch(9)

    await user.click(screen.getByRole('button', { name: /NFC/ }))
    await user.type(await screen.findByPlaceholderText('14자리 HEX'), '04A1B2C3D4E5F6')
    await user.click(screen.getByRole('button', { name: 'NFC로 변경' }))

    // 재조회로 새 `authMethod` 가 내려오기 전까지 QR 이 선택 상태로 남는 것이 **정상**이다.
    // 눌린 즉시 바뀌면 TAG ID 입력을 취소했을 때 화면과 서버가 어긋난 채 남는다.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /QR/ })).toHaveAttribute('aria-pressed', 'true')
    )
  })

  it('🔴 실패하면 모달이 닫히지 않는다 — 입력한 14자리가 사라지면 안 된다', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(UPDATE_POINT_PATH, () =>
        HttpResponse.json(
          { message: 'NFC 값을 입력해주세요.', data: false, code: 400 },
          { status: 400 }
        )
      )
    )
    renderSwitch(9)

    await user.click(screen.getByRole('button', { name: /NFC/ }))
    const input = await screen.findByPlaceholderText('14자리 HEX')
    await user.type(input, '04A1B2C3D4E5F6')
    await user.click(screen.getByRole('button', { name: 'NFC로 변경' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'NFC로 변경' })).toBeEnabled())
    expect(screen.getByPlaceholderText('14자리 HEX')).toHaveValue('04A1B2C3D4E5F6')
  })
})
