import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import LoginPage from '../LoginPage'
import { clearTokens, getAccessToken, getRefreshToken } from '@/lib/auth/tokens'

const LOGIN_PATH = '/api/v1/Login/W/Login'

/** 로그인 성공 응답. code가 사이트·권한을 함께 나타낸다(api-spec.md §2-1) */
const loginOk = (code: number) =>
  HttpResponse.json({
    message: '요청을 정상 처리하였습니다.',
    data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    code,
  })

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/zones" element={<div>SERVICE_HOME</div>} />
        <Route path="/admin/locations" element={<div>ADMIN_HOME</div>} />
      </Routes>
    </MemoryRouter>
  )

// placeholder로 찾는다 — `AppInput`의 <label>에 htmlFor가 없어 label-input 연결이
// 끊겨 있고 getByLabelText가 동작하지 않는다. AppInput은 004 D9에서 `AppFormField`로
// 이전 예정(deprecated)인 영역이라 본 spec에서 손대지 않았다 → spec 020 OQ-F.
const fillAndSubmit = async (loginId = '333333', loginPw = 'abcd123!') => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('사번을 입력해주세요'), loginId)
  await user.type(screen.getByPlaceholderText('비밀번호를 입력해주세요'), loginPw)
  await user.click(screen.getByRole('button', { name: /로그인/ }))
}

describe('LoginPage — 성공', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('현장 코드(201)면 토큰을 저장하고 현장 홈으로 이동한다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('SERVICE_HOME')).toBeInTheDocument())
    expect(getAccessToken()).toBe('new-access')
    expect(getRefreshToken()).toBe('new-refresh')
  })

  // 현장 로그인 화면으로 본사 계정이 들어올 수 있다(screens.md §1-1). code가 보낼 곳을 정한다.
  it.each([101, 102, 103])('본사 코드(%i)면 본사 홈으로 이동한다', async (code) => {
    server.use(http.post(LOGIN_PATH, () => loginOk(code)))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('ADMIN_HOME')).toBeInTheDocument())
    expect(getAccessToken()).toBe('new-access')
  })

  // 서버가 보낸 요청 본문이 swagger LoginDto(loginId/loginPw)와 맞는지 고정한다.
  it('입력값을 loginId/loginPw로 보낸다', async () => {
    let body: unknown = null
    server.use(
      http.post(LOGIN_PATH, async ({ request }) => {
        body = await request.json()
        return loginOk(201)
      })
    )

    renderLogin()
    await fillAndSubmit('123456', 'pass123!')

    await waitFor(() => expect(body).toEqual({ loginId: '123456', loginPw: 'pass123!' }))
  })
})

describe('LoginPage — 폼 검증', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('형식 위반이면 API를 호출하지 않는다', async () => {
    let called = false
    server.use(
      http.post(LOGIN_PATH, () => {
        called = true
        return loginOk(201)
      })
    )

    renderLogin()
    // 사번 9자(상한 8 초과) + 비번 7자(최소 8 미달)
    await fillAndSubmit('123456789', 'abc123!')

    await waitFor(() => expect(screen.getByText(/8자리 이하로/)).toBeInTheDocument())
    expect(screen.getByText(/8자리 이상/)).toBeInTheDocument()
    expect(called).toBe(false)
    expect(getAccessToken()).toBeNull()
  })

  it.each([
    ['영문 없음', '12345678!', /영문을 1자 이상/],
    ['숫자 없음', 'abcdefg!', /숫자를 1자 이상/],
    ['특수문자 없음', 'abcd1234', /특수문자를 1자 이상/],
  ])('비밀번호 복잡도 위반(%s)을 막는다', async (_label, password, expected) => {
    renderLogin()
    await fillAndSubmit('333333', password)

    await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
  })

  // 사번은 길이만 본다. 숫자 전용 제한은 명세에 없어 넣지 않았다(spec 020 §3).
  it('숫자가 아닌 사번도 통과시킨다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)))

    renderLogin()
    await fillAndSubmit('ab12cd', 'abcd123!')

    await waitFor(() => expect(screen.getByText('SERVICE_HOME')).toBeInTheDocument())
  })
})

describe('LoginPage — 실패', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('아이디·비번 불일치(400 + 래퍼)면 서버 문구를 폼에 보여준다', async () => {
    server.use(
      http.post(LOGIN_PATH, () =>
        HttpResponse.json(
          { message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null, code: 400 },
          { status: 400 }
        )
      )
    )

    renderLogin()
    await fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '아이디 또는 비밀번호가 올바르지 않습니다.'
      )
    )
    expect(getAccessToken()).toBeNull()
  })

  // 019 정규화가 ProblemDetails에서 errors 첫 항목을 뽑아준다. 폼은 형태를 다시 분기하지 않는다.
  it('유효성 400 + ProblemDetails면 errors 첫 항목을 보여준다', async () => {
    server.use(
      http.post(LOGIN_PATH, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc9110',
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { loginId: ['사번 형식이 올바르지 않습니다.'] },
            traceId: '00-abc-01',
          },
          { status: 400 }
        )
      )
    )

    renderLogin()
    await fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('사번 형식이 올바르지 않습니다.')
    )
  })

  it('네트워크 실패면 019 정규화 문구를 보여준다', async () => {
    server.use(http.post(LOGIN_PATH, () => HttpResponse.error()))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('네트워크 연결을 확인해주세요')
    )
    expect(getAccessToken()).toBeNull()
  })

  it('래퍼가 아닌 2xx 응답도 에러로 보여준다', async () => {
    server.use(http.post(LOGIN_PATH, () => HttpResponse.text('<html>oops</html>')))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
  })
})
