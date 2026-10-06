import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { AxiosError } from 'axios'

import axios from 'axios'

import api from '@/lib/axios'

const REFRESH_URL = '/api/v1/Login/W/sign/RefreshToken'

/**
 * 인터셉터 테스트.
 *
 * `axios-mock-adapter` 같은 패키지를 추가하지 않고 `defaults.adapter`를 갈아끼운다.
 * 어댑터는 axios의 공개 확장점이고, 이렇게 하면 요청·응답 인터셉터 체인을
 * 실제로 통과시킨 결과를 검증할 수 있다.
 */

const originalAdapter = api.defaults.adapter
const originalGlobalAdapter = axios.defaults.adapter

/** 주어진 본문을 그대로 돌려주는 어댑터 */
const respondWith = (
  data: unknown,
  status = 200,
  responseType?: InternalAxiosRequestConfig['responseType']
): AxiosAdapter => {
  return async (config) =>
    ({
      data,
      status,
      statusText: 'OK',
      headers: {},
      config: { ...config, responseType: responseType ?? config.responseType },
    }) as AxiosResponse
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  api.defaults.adapter = originalAdapter
  axios.defaults.adapter = originalGlobalAdapter
})

describe('성공 응답 unwrap', () => {
  it('code 200이면 data를 벗겨 반환한다', async () => {
    api.defaults.adapter = respondWith({
      message: '요청이 정상 처리되었습니다.',
      data: { pointSeq: 44, name: 'asdf' },
      code: 200,
    })

    const res = await api.get('/api/v1/Point/W/sign/DetailPoint')
    expect(res.data).toEqual({ pointSeq: 44, name: 'asdf' })
  })

  // 핵심 회귀 방지 — 기존 코드는 `code !== 200`을 실패로 보아 로그인을 전부 막았다.
  it.each([
    ['본사 시스템관리자', 101],
    ['본사 Master', 102],
    ['본사 Manager', 103],
    ['현장관리자', 201],
    ['근무자', 202],
  ])('로그인 성공 code %s(%i)도 성공으로 처리한다', async (_label, code) => {
    api.defaults.adapter = respondWith({
      message: '요청이 정상 처리되었습니다.',
      data: { accessToken: 'a', refreshToken: 'r' },
      code,
    })

    const res = await api.post('/api/v1/Login/W/Login', {})
    expect(res.data).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('data가 null인 래퍼도 성공으로 통과시킨다', async () => {
    api.defaults.adapter = respondWith({ message: 'ok', data: null, code: 200 })

    const res = await api.post('/api/v1/Login/W/sign/Logout')
    expect(res.data).toBeNull()
  })

  it('2xx인데 래퍼가 아니면 거부한다', async () => {
    api.defaults.adapter = respondWith({ foo: 'bar' })

    await expect(api.get('/api/v1/anything')).rejects.toThrow('알 수 없는 응답 형식')
  })
})

describe('_raw — 래퍼 보존 탈출구', () => {
  it('_raw: true면 code를 포함한 래퍼 전체를 반환한다', async () => {
    api.defaults.adapter = respondWith({
      message: '요청이 정상 처리되었습니다.',
      data: { accessToken: 'a', refreshToken: 'r' },
      code: 201,
    })

    const res = await api.post('/api/v1/Login/W/Login', {}, { _raw: true })
    expect(res.data).toEqual({
      message: '요청이 정상 처리되었습니다.',
      data: { accessToken: 'a', refreshToken: 'r' },
      code: 201,
    })
    // 로그인 화면이 이 값으로 사이트를 분기한다
    expect(res.data.code).toBe(201)
  })

  it('_raw여도 래퍼가 아니면 거부한다', async () => {
    api.defaults.adapter = respondWith('<html>oops</html>')

    await expect(api.post('/api/v1/Login/W/Login', {}, { _raw: true })).rejects.toThrow(
      '알 수 없는 응답 형식'
    )
  })

  it('_raw 없으면 기존대로 unwrap한다', async () => {
    api.defaults.adapter = respondWith({ message: 'ok', data: { a: 1 }, code: 201 })

    const res = await api.post('/api/v1/Login/W/Login', {})
    expect(res.data).toEqual({ a: 1 })
  })
})

describe('blob 우회', () => {
  it('responseType이 blob이면 unwrap하지 않고 통과시킨다', async () => {
    const payload = { notAWrapper: true }
    api.defaults.adapter = respondWith(payload, 200, 'blob')

    const res = await api.get('/api/v1/export', { responseType: 'blob' })
    expect(res.data).toBe(payload)
  })
})

/** 지정 status·body로 거부하는 어댑터. 호출 경로를 기록해 재발급 시도 여부를 본다. */
const rejectWith = (status: number, data: unknown, calls: string[] = []): AxiosAdapter => {
  return async (config) => {
    calls.push(config.url ?? '')
    const error = new AxiosError('fail', undefined, config, undefined, {
      data,
      status,
      statusText: 'ERR',
      headers: {},
      config,
    } as AxiosResponse)
    throw error
  }
}

describe('에러 응답 정규화', () => {
  it('400 + 래퍼 → 서버 message를 그대로 쓴다', async () => {
    api.defaults.adapter = rejectWith(400, {
      message: '아이디 또는 비밀번호가 올바르지 않습니다.',
      data: null,
      code: 400,
    })

    await expect(api.post('/api/v1/Login/W/Login', {})).rejects.toMatchObject({
      name: 'ApiError',
      message: '아이디 또는 비밀번호가 올바르지 않습니다.',
      kind: 'wrapper',
      status: 400,
    })
  })

  it('400 + ProblemDetails → errors 첫 항목을 쓴다', async () => {
    api.defaults.adapter = rejectWith(400, {
      errors: { siteSeq: ['The siteSeq field is required.'] },
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      traceId: '00-abc-00',
    })

    await expect(api.get('/api/v1/Point/W/sign/GetPointList')).rejects.toMatchObject({
      message: 'The siteSeq field is required.',
      kind: 'problem',
    })
  })

  it('500 + ProblemDetails → detail을 쓴다', async () => {
    api.defaults.adapter = rejectWith(500, {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
      title: 'An error occurred while processing your request.',
      status: 500,
      detail: '서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.',
      traceId: '00-def-00',
    })

    await expect(api.get('/api/v1/Group/W/sign/GetGroupList')).rejects.toMatchObject({
      message: '서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.',
      kind: 'problem',
      status: 500,
    })
  })

  it('네트워크 실패 → kind network', async () => {
    api.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    }

    await expect(api.get('/api/v1/anything')).rejects.toMatchObject({
      message: '네트워크 연결을 확인해주세요',
      kind: 'network',
      status: null,
    })
  })

  it('던지는 값은 Error를 상속한다 — 기존 error.message 접근부 호환', async () => {
    api.defaults.adapter = rejectWith(404, '')

    const error = await api.get('/api/v1/anything').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('요청한 대상을 찾을 수 없습니다')
  })
})

describe('403 — 빈 body, 재발급 시도 없음', () => {
  it('403은 재발급을 시도하지 않는다 (권한 부족이지 만료가 아님)', async () => {
    localStorage.setItem('auth.accessToken', 'token-123')
    localStorage.setItem('auth.refreshToken', 'refresh-123')
    const calls: string[] = []
    api.defaults.adapter = rejectWith(403, '', calls)

    await expect(api.get('/api/v1/User/W/sign/UserList')).rejects.toMatchObject({
      kind: 'empty',
      status: 403,
      message: '접근 권한이 없습니다',
    })

    // 재발급을 시도했다면 RefreshToken 경로가 호출됐을 것이다
    expect(calls).toEqual(['/api/v1/User/W/sign/UserList'])
  })

  it('403 빈 body에서 파싱 예외가 아니라 정상 ApiError로 거부된다', async () => {
    api.defaults.adapter = rejectWith(403, '')

    const error = await api.get('/api/v1/anything').catch((e: unknown) => e)
    // 빈 body를 JSON으로 파싱하려 들면 SyntaxError/TypeError가 나온다 — 그게 019가 막는 사고다
    expect(error).not.toBeInstanceOf(SyntaxError)
    expect(error).not.toBeInstanceOf(TypeError)
    expect((error as Error).name).toBe('ApiError')
  })
})

/** 실측 재발급 성공 응답 — code가 201이다(200 아님) */
const REFRESH_OK = {
  message: '요청을 정상 처리하였습니다.',
  data: { accessToken: 'new-access', refreshToken: 'same-refresh' },
  code: 201,
}

/**
 * 401 → 재발급 → 재시도 시나리오를 깐다.
 *
 * `runRefresh`는 재귀를 피하려고 **인터셉터를 타지 않는 전역 axios**를 쓴다.
 * 그래서 `api.defaults.adapter`만 바꾸면 재발급 요청을 가로챌 수 없다 — 전역도 함께 깐다.
 */
const installRefreshFlow = (refresh: { status: number; body: unknown }) => {
  const seen = { refreshCalls: 0, refreshUrl: '', refreshAuth: '', protectedCalls: 0 }
  let accessValid = false

  const fail = (config: InternalAxiosRequestConfig, status: number, data: unknown) =>
    new AxiosError('fail', undefined, config, undefined, {
      data,
      status,
      statusText: 'ERR',
      headers: {},
      config,
    } as AxiosResponse)

  const adapter: AxiosAdapter = async (config) => {
    const url = config.url ?? ''

    if (url.includes(REFRESH_URL)) {
      seen.refreshCalls += 1
      seen.refreshUrl = url
      seen.refreshAuth = String(config.headers.get('Authorization') ?? '')
      if (refresh.status >= 400) throw fail(config, refresh.status, refresh.body)
      accessValid = true
      return {
        data: refresh.body,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse
    }

    seen.protectedCalls += 1
    if (!accessValid) throw fail(config, 401, '')
    return {
      data: { message: 'ok', data: { ok: true }, code: 200 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    } as AxiosResponse
  }

  api.defaults.adapter = adapter
  axios.defaults.adapter = adapter
  return seen
}

describe('토큰 재발급', () => {
  beforeEach(() => {
    localStorage.setItem('auth.accessToken', 'old-access')
    localStorage.setItem('auth.refreshToken', 'old-refresh')
  })

  it('401 → 재발급(code 201) → 원 요청 재시도 성공', async () => {
    const seen = installRefreshFlow({ status: 200, body: REFRESH_OK })

    const res = await api.get('/api/v1/Point/W/sign/GetPointList')

    expect(res.data).toEqual({ ok: true })
    expect(seen.refreshCalls).toBe(1)
    expect(seen.protectedCalls).toBe(2) // 최초 401 + 재시도
    expect(localStorage.getItem('auth.accessToken')).toBe('new-access')
  })

  it('재발급 요청이 실경로로 나간다', async () => {
    const seen = installRefreshFlow({ status: 200, body: REFRESH_OK })

    await api.get('/api/v1/anything')

    expect(seen.refreshUrl).toContain('/api/v1/Login/W/sign/RefreshToken')
  })

  it('재발급 요청에 Authorization 헤더가 붙는다', async () => {
    const seen = installRefreshFlow({ status: 200, body: REFRESH_OK })

    await api.get('/api/v1/anything')

    // 실측상 body의 refreshToken과 Bearer 헤더를 둘 다 요구한다
    expect(seen.refreshAuth).toBe('Bearer old-access')
  })

  it('refreshToken이 회전하지 않아도(같은 값) 정상 처리한다', async () => {
    localStorage.setItem('auth.refreshToken', 'same-refresh')
    installRefreshFlow({ status: 200, body: REFRESH_OK })

    await expect(api.get('/api/v1/anything')).resolves.toBeDefined()
    expect(localStorage.getItem('auth.refreshToken')).toBe('same-refresh')
  })

  it('동시 401 다발이어도 재발급은 1회만 (single-flight)', async () => {
    const seen = installRefreshFlow({ status: 200, body: REFRESH_OK })

    await Promise.all([
      api.get('/api/v1/a'),
      api.get('/api/v1/b'),
      api.get('/api/v1/c'),
    ])

    expect(seen.refreshCalls).toBe(1)
  })

  it('재발급 후에도 401이면 _retry로 차단되어 무한루프가 없다', async () => {
    const seen = { count: 0 }
    const adapter: AxiosAdapter = async (config) => {
      const url = config.url ?? ''
      if (url.includes(REFRESH_URL)) {
        return {
          data: REFRESH_OK,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse
      }
      seen.count += 1
      throw new AxiosError('unauthorized', undefined, config, undefined, {
        data: '',
        status: 401,
        statusText: 'ERR',
        headers: {},
        config,
      } as AxiosResponse)
    }
    api.defaults.adapter = adapter
    axios.defaults.adapter = adapter

    await expect(api.get('/api/v1/anything')).rejects.toMatchObject({ name: 'ApiError' })
    expect(seen.count).toBe(2) // 최초 + 재시도 1회로 끝
  })

  it('재발급 요청 자체의 401은 재귀하지 않는다', async () => {
    const calls: string[] = []
    api.defaults.adapter = rejectWith(401, '', calls)
    axios.defaults.adapter = rejectWith(401, '', calls)

    // 재발급 경로를 api로 직접 호출 — isRefreshRequest 가드가 재발급 시도를 막아야 한다
    await expect(api.post(REFRESH_URL, {})).rejects.toMatchObject({ name: 'ApiError' })
    expect(calls).toEqual([REFRESH_URL])
  })

  it('refreshToken이 없으면 재발급을 생략하고 토큰을 비운다', async () => {
    localStorage.removeItem('auth.refreshToken')
    const seen = installRefreshFlow({ status: 200, body: REFRESH_OK })

    await expect(api.get('/api/v1/anything')).rejects.toMatchObject({ name: 'ApiError' })

    expect(seen.refreshCalls).toBe(0)
    expect(localStorage.getItem('auth.accessToken')).toBeNull()
  })

  it('재발급이 실패하면 토큰을 비운다', async () => {
    installRefreshFlow({ status: 401, body: '' })

    await expect(api.get('/api/v1/anything')).rejects.toMatchObject({ name: 'ApiError' })

    expect(localStorage.getItem('auth.accessToken')).toBeNull()
    expect(localStorage.getItem('auth.refreshToken')).toBeNull()
  })
})

describe('요청 인터셉터', () => {
  it('accessToken이 있으면 Authorization 헤더를 붙인다', async () => {
    localStorage.setItem('auth.accessToken', 'token-123')
    let seen: string | undefined
    api.defaults.adapter = async (config) => {
      seen = config.headers.get('Authorization') as string
      return {
        data: { message: 'ok', data: null, code: 200 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse
    }

    await api.get('/api/v1/anything')
    expect(seen).toBe('Bearer token-123')
  })

  it('accessToken이 없으면 헤더를 붙이지 않는다', async () => {
    let seen: string | undefined
    api.defaults.adapter = async (config) => {
      seen = config.headers.get('Authorization') as string
      return {
        data: { message: 'ok', data: null, code: 200 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      } as AxiosResponse
    }

    await api.get('/api/v1/anything')
    expect(seen).toBeUndefined()
  })
})
