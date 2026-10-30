import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { clearTokens, getAccessToken, setAccessToken } from '@/lib/auth/tokens'
import { makeAccessToken } from '@/test/jwt'
import { LogoutButton } from '../LogoutButton'

/**
 * 로그아웃 버튼 (`spec 053` — `ProfileBadge` 대체). 🔴 확인 모달을 거친다.
 */

const FIELD_TOKEN = makeAccessToken({ userName: '홍길동' })
const ADMIN_TOKEN = makeAccessToken({ userName: '홍길동', [MS_ROLE_CLAIM]: 'SystemManager' })

const renderAt = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/*" element={<LogoutButton tooltipSide="right" />} />
        <Route path="/" element={<div>SERVICE_LOGIN</div>} />
        <Route path="/admin/login" element={<div>ADMIN_LOGIN</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('LogoutButton', () => {
  beforeEach(() => clearTokens())

  it('🔴 누르면 바로 로그아웃하지 않고 이름이 든 확인 모달을 띄운다', async () => {
    setAccessToken(FIELD_TOKEN)
    renderAt('/zones')

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('홍길동 님 계정에서 로그아웃합니다.')).toBeInTheDocument()
    expect(getAccessToken()).not.toBeNull()
  })

  it('확인 → 토큰 clear + 현장 로그인으로 이동', async () => {
    setAccessToken(FIELD_TOKEN)
    renderAt('/zones')

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '로그아웃' }))

    await waitFor(() => expect(screen.getByText('SERVICE_LOGIN')).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
  })

  it('취소 → 로그인 유지', async () => {
    setAccessToken(FIELD_TOKEN)
    renderAt('/zones')

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    await userEvent.click(await screen.findByRole('button', { name: '취소' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(getAccessToken()).not.toBeNull()
  })

  it('본사 영역에서는 /admin/login 으로 이동', async () => {
    setAccessToken(ADMIN_TOKEN)
    renderAt('/admin/locations')

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: '로그아웃' }))

    await waitFor(() => expect(screen.getByText('ADMIN_LOGIN')).toBeInTheDocument())
  })
})
