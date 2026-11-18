import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/server'
import { appRequest, loginApp, resetAppSessions } from '../appClient'
import { SimApiError } from '../simError'

const APP = 'http://app.test'
const LOGIN = `${APP}/api/v1/Login/M/Login`
const PROFILE = `${APP}/api/v1/User/M/sign/MyProfile`

const wrap = (data: unknown, code = 200) => ({ message: 'ok', data, code })

/** 로그인할 때마다 `{loginId}-{n}` 토큰을 준다 — 몇 번째 로그인인지 드러난다 */
const useLogin = () => {
  const counts = new Map<string, number>()
  server.use(
    http.post(LOGIN, async ({ request }) => {
      const body = (await request.json()) as { loginId: string; loginPw: string }
      if (body.loginPw !== 'pw') {
        return HttpResponse.json(
          { message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null, code: 400 },
          { status: 400 }
        )
      }
      const n = (counts.get(body.loginId) ?? 0) + 1
      counts.set(body.loginId, n)
      return HttpResponse.json(wrap({ accessToken: `${body.loginId}-${n}`, refreshToken: 'r' }, 202))
    })
  )
  return counts
}

beforeEach(() => {
  vi.stubEnv('VITE_APP_API_BASE_URL', APP)
  vi.stubEnv('VITE_SIM_WORKER_PW', 'pw')
  resetAppSessions()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('appClient', () => {
  it('근무자마다 자기 토큰으로 호출한다', async () => {
    useLogin()
    server.use(
      http.get(PROFILE, ({ request }) =>
        HttpResponse.json(wrap({ token: request.headers.get('authorization') }))
      )
    )

    const [a, b] = await Promise.all([
      appRequest<{ token: string }>('600101', { url: '/api/v1/User/M/sign/MyProfile' }),
      appRequest<{ token: string }>('600102', { url: '/api/v1/User/M/sign/MyProfile' }),
    ])

    expect(a.token).toBe('Bearer 600101-1')
    expect(b.token).toBe('Bearer 600102-1')
  })

  it('같은 계정의 동시 호출은 로그인을 한 번만 한다', async () => {
    const counts = useLogin()
    server.use(http.get(PROFILE, () => HttpResponse.json(wrap(true))))

    await Promise.all([
      appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' }),
      appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' }),
      appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' }),
    ])

    expect(counts.get('600101')).toBe(1)
  })

  it('401 이면 다시 로그인해 한 번 재시도한다', async () => {
    const counts = useLogin()
    server.use(
      http.get(PROFILE, ({ request }) =>
        request.headers.get('authorization') === 'Bearer 600101-1'
          ? HttpResponse.json({ message: '잘못된 요청입니다.', data: null, code: 401 }, { status: 401 })
          : HttpResponse.json(wrap('second'))
      )
    )

    await expect(appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' })).resolves.toBe('second')
    expect(counts.get('600101')).toBe(2)
  })

  it('다시 로그인해도 401 이면 그대로 실패한다(무한 재시도 없음)', async () => {
    const counts = useLogin()
    server.use(
      http.get(PROFILE, () =>
        HttpResponse.json({ message: '잘못된 요청입니다.', data: null, code: 401 }, { status: 401 })
      )
    )

    await expect(appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' })).rejects.toMatchObject({
      status: 401,
    })
    expect(counts.get('600101')).toBe(2)
  })

  it('비밀번호가 틀리면 서버 문구를 담은 SimApiError 로 실패한다', async () => {
    useLogin()
    vi.stubEnv('VITE_SIM_WORKER_PW', 'wrong')

    const error = await loginApp('600101').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(SimApiError)
    expect(error).toMatchObject({ status: 400, message: '아이디 또는 비밀번호가 올바르지 않습니다.' })
  })

  it('권한 없음(403 · 빈 body)은 상태만으로 알린다', async () => {
    useLogin()
    server.use(http.get(PROFILE, () => new HttpResponse(null, { status: 403 })))

    await expect(appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' })).rejects.toMatchObject({
      status: 403,
      message: 'HTTP 403 (본문 없음)',
    })
  })

  it('유효성 오류(ProblemDetails)는 필드 문구를 꺼낸다', async () => {
    useLogin()
    server.use(
      http.get(PROFILE, () =>
        HttpResponse.json(
          {
            errors: { 'memoInfo.memo': ['The memo field is required.'] },
            type: 't',
            title: 'One or more validation errors occurred.',
            status: 400,
            traceId: '00',
          },
          { status: 400 }
        )
      )
    )

    await expect(appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' })).rejects.toMatchObject({
      status: 400,
      message: 'The memo field is required.',
    })
  })

  it('서버에 닿지 않으면 상태 없이 연결 실패로 알린다', async () => {
    useLogin()
    server.use(http.get(PROFILE, () => HttpResponse.error()))

    await expect(appRequest('600101', { url: '/api/v1/User/M/sign/MyProfile' })).rejects.toMatchObject({
      status: null,
    })
  })
})
