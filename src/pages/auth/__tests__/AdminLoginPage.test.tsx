import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import AdminLoginPage from '../AdminLoginPage'
import { clearTokens, getAccessToken } from '@/lib/auth/tokens'

const LOGIN_PATH = '/api/v1/Login/W/Login'

const loginOk = (code: number) =>
  HttpResponse.json({
    message: '요청을 정상 처리하였습니다.',
    data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    code,
  })

const renderAdminLogin = () =>
  render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/locations" element={<div>ADMIN_HOME</div>} />
        <Route path="/zones" element={<div>SERVICE_HOME</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillAndSubmit = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('사번을 입력해주세요'), '000000')
  await user.type(screen.getByPlaceholderText('비밀번호를 입력해주세요'), 'abcd123!')
  await user.click(screen.getByRole('button', { name: /로그인/ }))
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('본사 로그인 제목을 보여준다', () => {
    renderAdminLogin()
    expect(screen.getByRole('heading', { name: '본사 로그인' })).toBeInTheDocument()
  })

  it.each([101, 102, 103])(
    'Admin 코드(%i)면 토큰을 저장하고 본사 홈으로 이동한다',
    async (code) => {
      server.use(http.post(LOGIN_PATH, () => loginOk(code)))

      renderAdminLogin()
      await fillAndSubmit()

      await waitFor(() => expect(screen.getByText('ADMIN_HOME')).toBeInTheDocument())
      expect(getAccessToken()).toBe('new-access')
    }
  )

  // 본사 로그인 화면에 현장 계정이 들어오는 경우. 화면이 아니라 code가 착지점을 정한다 —
  // 현장 계정을 본사 홈으로 보내면 가드가 막아 /403이 된다.
  it('현장 코드(201)로 로그인하면 현장 홈으로 보낸다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)))

    renderAdminLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('SERVICE_HOME')).toBeInTheDocument())
  })

  it('로그인 실패 문구를 폼에 보여준다', async () => {
    server.use(
      http.post(LOGIN_PATH, () =>
        HttpResponse.json(
          { message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null, code: 400 },
          { status: 400 }
        )
      )
    )

    renderAdminLogin()
    await fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '아이디 또는 비밀번호가 올바르지 않습니다.'
      )
    )
    expect(getAccessToken()).toBeNull()
  })
})
