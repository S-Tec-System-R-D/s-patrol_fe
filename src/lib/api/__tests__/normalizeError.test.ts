import { describe, expect, it } from 'vitest'
import type { AxiosError, AxiosResponse } from 'axios'

import { normalizeError } from '@/lib/api/normalizeError'

/** 응답 있는 AxiosError 최소 형태 — 정규화가 보는 것은 status와 data뿐이다. */
const errorWith = (status: number, data: unknown): AxiosError =>
  ({ response: { status, data } as AxiosResponse }) as AxiosError

/** 응답 없는 AxiosError (오프라인·타임아웃·CORS) */
const networkError = () => ({ response: undefined }) as AxiosError

describe('normalizeError — (A) ApiResponse 래퍼', () => {
  it('400 래퍼는 message를 그대로 쓴다', () => {
    const result = normalizeError(
      errorWith(400, { message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null, code: 400 })
    )
    expect(result.kind).toBe('wrapper')
    expect(result.status).toBe(400)
    expect(result.message).toBe('아이디 또는 비밀번호가 올바르지 않습니다.')
  })

  it('401 래퍼(세션 만료)도 message를 쓴다', () => {
    const result = normalizeError(
      errorWith(401, { message: '세션이 만료되었거나 유효하지 않습니다.', data: null, code: 401 })
    )
    expect(result.kind).toBe('wrapper')
    expect(result.message).toBe('세션이 만료되었거나 유효하지 않습니다.')
  })

  it('message가 빈 문자열이면 status 기본 문구로 대체한다', () => {
    const result = normalizeError(errorWith(400, { message: '', data: null, code: 400 }))
    expect(result.message).toBe('요청을 처리하지 못했습니다')
  })
})

describe('normalizeError — (B) ProblemDetails', () => {
  it('유효성 오류는 errors 첫 항목을 쓴다', () => {
    const result = normalizeError(
      errorWith(400, {
        errors: { siteSeq: ['The siteSeq field is required.'] },
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        traceId: '00-abc-00',
      })
    )
    expect(result.kind).toBe('problem')
    expect(result.message).toBe('The siteSeq field is required.')
  })

  it('errors가 없으면 detail을 쓴다', () => {
    const result = normalizeError(
      errorWith(500, {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
        title: 'An error occurred while processing your request.',
        status: 500,
        detail: '서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.',
        traceId: '00-def-00',
      })
    )
    expect(result.kind).toBe('problem')
    expect(result.status).toBe(500)
    expect(result.message).toBe('서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.')
  })

  it('errors·detail이 모두 없으면 title을 쓴다', () => {
    const result = normalizeError(errorWith(400, { title: 'Bad Request', status: 400 }))
    expect(result.message).toBe('Bad Request')
  })

  it('errors가 빈 객체면 detail로 넘어간다', () => {
    const result = normalizeError(
      errorWith(400, { errors: {}, title: 'T', status: 400, detail: 'D', traceId: 'x', type: 'y' })
    )
    expect(result.message).toBe('D')
  })
})

describe('normalizeError — (C) 빈 body', () => {
  // 401·403은 서버가 본문을 주지 않는다. 파싱하면 터진다.
  it('401 빈 body → 재로그인 안내', () => {
    const result = normalizeError(errorWith(401, ''))
    expect(result.kind).toBe('empty')
    expect(result.status).toBe(401)
    expect(result.message).toBe('다시 로그인이 필요합니다')
  })

  it('403 빈 body → 권한 문구를 클라이언트가 만든다', () => {
    const result = normalizeError(errorWith(403, ''))
    expect(result.kind).toBe('empty')
    expect(result.message).toBe('접근 권한이 없습니다')
  })

  it('body가 null·undefined여도 빈 것으로 본다', () => {
    expect(normalizeError(errorWith(403, null)).kind).toBe('empty')
    expect(normalizeError(errorWith(403, undefined)).kind).toBe('empty')
  })
})

describe('normalizeError — 네트워크 실패', () => {
  it('response가 없으면 network', () => {
    const result = normalizeError(networkError())
    expect(result.kind).toBe('network')
    expect(result.status).toBeNull()
    expect(result.message).toBe('네트워크 연결을 확인해주세요')
  })
})

describe('normalizeError — 알 수 없는 형식', () => {
  it('래퍼도 ProblemDetails도 아니면 unknown + status 기본 문구', () => {
    const result = normalizeError(errorWith(418, { foo: 'bar' }))
    expect(result.kind).toBe('unknown')
    expect(result.message).toBe('요청을 처리하지 못했습니다')
    expect(result.raw).toEqual({ foo: 'bar' })
  })

  it('HTML 문자열이 와도 터지지 않는다', () => {
    const result = normalizeError(errorWith(502, '<html>Bad Gateway</html>'))
    expect(result.kind).toBe('unknown')
    expect(result.message).toBe('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요')
  })
})

describe('normalizeError — status별 기본 문구', () => {
  it.each([
    [401, '다시 로그인이 필요합니다'],
    [403, '접근 권한이 없습니다'],
    [404, '요청한 대상을 찾을 수 없습니다'],
    [500, '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요'],
    [503, '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요'],
    [409, '요청을 처리하지 못했습니다'],
  ])('%i → %s', (status, expected) => {
    expect(normalizeError(errorWith(status, '')).message).toBe(expected)
  })
})

describe('normalizeError — 어떤 입력에도 throw하지 않는다', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['빈 문자열', ''],
    ['문자열', 'oops'],
    ['숫자', 42],
    ['배열', [1, 2]],
    ['빈 객체', {}],
    ['중첩 객체', { a: { b: { c: 1 } } }],
  ])('%s body에서 예외가 없고 message가 비어 있지 않다', (_label, body) => {
    expect(() => normalizeError(errorWith(400, body))).not.toThrow()
    expect(normalizeError(errorWith(400, body)).message.length).toBeGreaterThan(0)
  })
})
