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

  it('랜딩과 같은 틀 — 제목 S-Patrol + 관리자 배지 · 본사 안내 문구 · 소개 슬라이드(spec 063)', () => {
    renderAdminLogin()
    expect(screen.getByRole('heading', { level: 1, name: 'S-Patrol 관리자' })).toBeInTheDocument()
    expect(screen.getByText('본사 관리자 전용 로그인입니다')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '서비스 소개' })).toBeInTheDocument()
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

  // 🔴 본사 로그인에 현장 계정이 들어오면 막고 현장 로그인 링크를 준다(spec 063 — 020 의
  // "code 가 착지점을 정한다" 를 뒤집었다). 토큰은 저장하지 않는다.
  it('현장 코드(201)면 막는다 — 현장 로그인(/) 링크 · 토큰 저장 안 함', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)))

    renderAdminLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/현장 로그인을 이용/))
    expect(screen.getByRole('link', { name: '현장 로그인으로 이동' })).toHaveAttribute('href', '/')
    expect(screen.queryByText('SERVICE_HOME')).not.toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
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
