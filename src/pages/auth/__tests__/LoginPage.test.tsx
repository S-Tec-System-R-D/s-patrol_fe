import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import LoginPage from '../LoginPage'
import { clearTokens, getAccessToken, getRefreshToken } from '@/lib/auth/tokens'
import { clearSite, getSiteName, getSiteSeq } from '@/lib/auth/site'

const LOGIN_PATH = '/api/v1/Login/W/Login'
const USER_SITE_SELECT_PATH = '/api/v1/Login/W/sign/UserSiteSelect'

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

describe('LoginPage — 근무자 차단 (US3)', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  /**
   * 🔴 US3의 전부: **서버가 로그인을 성공시키고 토큰까지 발급하지만 저장하지 않는다.**
   * 근무자는 APP 전용(CLAUDE.md B1)이고 차단은 프론트 책임이다.
   * 저장 후 차단이면 새로고침 시 토큰이 살아 있어 가드를 통과할 여지가 생긴다.
   */
  it('근무자(202)는 토큰이 저장되지 않는다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(202)))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('근무자(202)는 화면 이동 없이 안내를 보여준다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(202)))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/모바일 앱/))
    // 로그인 화면에 그대로 머문다
    expect(screen.queryByText('SERVICE_HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('ADMIN_HOME')).not.toBeInTheDocument()
  })

  // 사전에 없는 code. 어느 사이트로든 추측해 보내지 않는다(A1).
  it('사전에 없는 code면 토큰을 저장하지 않고 안내만 한다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(999)))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(getAccessToken()).toBeNull()
    expect(screen.queryByText('SERVICE_HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('ADMIN_HOME')).not.toBeInTheDocument()
  })
})

/**
 * 사업장 선택 (spec 021 US1·US2).
 *
 * 선택은 **라우트가 아니라 로그인 카드 안의 단계**다. 따라서 "현장 홈으로 갔는가"는
 * 선택을 마친 뒤에만 참이 된다.
 */
describe('LoginPage — 사업장 선택 (US1, US2)', () => {
  beforeEach(() => {
    clearTokens()
    clearSite()
    server.resetHandlers()
  })

  /** `api-spec.md` §5-2 실측 구조 — 루트 아래 `children`, 필드명이 루트와 다르다 */
  const siteSelectOk = (children: { childSiteSeq: number; childSiteName: string }[]) =>
    http.get(USER_SITE_SELECT_PATH, () =>
      HttpResponse.json({
        message: '요청을 정상 처리하였습니다.',
        data: {
          siteSeq: 6,
          siteName: '강동지사',
          children: children.map((child) => ({ ...child, parentSeq: 6 })),
        },
        code: 200,
      })
    )

  const TWO_SITES = [
    { childSiteSeq: 7, childSiteName: '강동 테크노타워' },
    { childSiteSeq: 8, childSiteName: '강동 그랜드타워' },
  ]

  it('사업장이 2개면 선택 단계로 전환된다 — 아직 홈으로 가지 않는다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)), siteSelectOk(TWO_SITES))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('사업장 선택')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '강동 테크노타워' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '강동 그랜드타워' })).toBeInTheDocument()
    expect(screen.queryByText('SERVICE_HOME')).not.toBeInTheDocument()
  })

  it('사업장을 선택하면 siteSeq·siteName을 저장하고 현장 홈으로 간다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)), siteSelectOk(TWO_SITES))

    renderLogin()
    await fillAndSubmit()

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: '강동 그랜드타워' }))

    await waitFor(() => expect(screen.getByText('SERVICE_HOME')).toBeInTheDocument())
    expect(getSiteSeq()).toBe(8)
    expect(getSiteName()).toBe('강동 그랜드타워')
  })

  /**
   * 🔴 1개는 선택 UI를 건너뛰지만 **저장은 건너뛰지 않는다**(spec 021 §3 규칙 10).
   * 저장 없이 이동하면 siteSeq 없이 홈에 들어가고, 그 조회는 403이 아니라
   * `200` + 빈 목록으로 돌아와(api-spec.md:211) 조용히 틀린 화면이 된다.
   */
  it('사업장이 1개면 선택 화면 없이 자동 진입하고, 저장은 그대로 한다', async () => {
    server.use(
      http.post(LOGIN_PATH, () => loginOk(201)),
      siteSelectOk([{ childSiteSeq: 7, childSiteName: '강동 테크노타워' }])
    )

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('SERVICE_HOME')).toBeInTheDocument())
    expect(screen.queryByText('사업장 선택')).not.toBeInTheDocument()
    expect(getSiteSeq()).toBe(7)
    expect(getSiteName()).toBe('강동 테크노타워')
  })

  /** 루트는 선택 대상이 아니다(api-spec.md §2-2). children 밖의 siteSeq가 새면 안 된다 */
  it('루트 사업장(siteSeq 6)은 선택지에 나타나지 않는다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(201)), siteSelectOk(TWO_SITES))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('사업장 선택')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: '강동지사' })).not.toBeInTheDocument()
  })

  /** 본사는 선택 단계가 없다 — siteSeq 소비처가 0개이고 응답 형태도 미실측(Phase 5) */
  it('본사 계정은 사업장 선택 없이 본사 홈으로 간다', async () => {
    server.use(http.post(LOGIN_PATH, () => loginOk(101)))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => expect(screen.getByText('ADMIN_HOME')).toBeInTheDocument())
    expect(getSiteSeq()).toBeNull()
  })
})

/**
 * 사업장 확보 실패 (spec 021 US3 · §4).
 *
 * 🔴 **세 경우 모두 토큰을 남기지 않는 것이 핵심이다.** 토큰이 남으면
 * "토큰 있음 + siteSeq 없음" 중간 상태가 되고, 새로고침 시 AuthGuard가 통과시켜
 * siteSeq 없이 홈이 조회를 날린다. 그 응답은 403이 아니라 `200` + 빈 목록이라
 * (api-spec.md:211) 에러로 드러나지도 않는다.
 */
describe('LoginPage — 사업장 확보 실패 (US3)', () => {
  beforeEach(() => {
    clearTokens()
    clearSite()
    server.resetHandlers()
  })

  const expectStuckAtLogin = async (pattern: RegExp) => {
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(pattern))
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(getSiteSeq()).toBeNull()
    expect(screen.queryByText('SERVICE_HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('사업장 선택')).not.toBeInTheDocument()
  }

  it('소속 사업장이 0개면 안내하고 토큰을 남기지 않는다', async () => {
    server.use(
      http.post(LOGIN_PATH, () => loginOk(201)),
      http.get(USER_SITE_SELECT_PATH, () =>
        HttpResponse.json({
          message: '요청을 정상 처리하였습니다.',
          data: { siteSeq: 6, siteName: '강동지사', children: [] },
          code: 200,
        })
      )
    )

    renderLogin()
    await fillAndSubmit()

    await expectStuckAtLogin(/소속된 사업장이 없습니다/)
  })

  it('UserSiteSelect가 500이면 토큰을 남기지 않는다', async () => {
    server.use(
      http.post(LOGIN_PATH, () => loginOk(201)),
      http.get(USER_SITE_SELECT_PATH, () => new HttpResponse(null, { status: 500 }))
    )

    renderLogin()
    await fillAndSubmit()

    await expectStuckAtLogin(/./)
  })

  /**
   * 403은 "현장 code인데 서버는 본사 계정으로 판정"한 경우다 —
   * `UserSiteSelect`와 `AdminSiteSelect`는 상호 배타(api-spec.md:286·287).
   * code와 서버 판정이 어긋났다는 뜻이라 추측으로 통과시키지 않는다(A1).
   */
  it('UserSiteSelect가 403이면 통과시키지 않고 토큰을 남기지 않는다', async () => {
    server.use(
      http.post(LOGIN_PATH, () => loginOk(201)),
      http.get(USER_SITE_SELECT_PATH, () => new HttpResponse(null, { status: 403 }))
    )

    renderLogin()
    await fillAndSubmit()

    await expectStuckAtLogin(/./)
  })

  it('네트워크 실패면 토큰을 남기지 않는다', async () => {
    server.use(
      http.post(LOGIN_PATH, () => loginOk(201)),
      http.get(USER_SITE_SELECT_PATH, () => HttpResponse.error())
    )

    renderLogin()
    await fillAndSubmit()

    await expectStuckAtLogin(/네트워크/)
  })
})
