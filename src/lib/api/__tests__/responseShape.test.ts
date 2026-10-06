import { describe, expect, it } from 'vitest'

import { isApiResponse, isEmptyBody, isProblemDetails } from '@/lib/api/responseShape'

/** 실측 응답 샘플 (docs/api-spec.md §3) */
const WRAPPER = { message: '요청이 정상 처리되었습니다.', data: { pointSeq: 44 }, code: 200 }
const WRAPPER_ERROR = { message: '잘못된 요청입니다.', data: null, code: 400 }
const PROBLEM_VALIDATION = {
  errors: { siteSeq: ['The siteSeq field is required.'] },
  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
  title: 'One or more validation errors occurred.',
  status: 400,
  traceId: '00-abc-00',
}
const PROBLEM_SERVER = {
  type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
  title: 'An error occurred while processing your request.',
  status: 500,
  detail: '서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.',
  traceId: '00-def-00',
}

/** 세 함수에 공통으로 넣어볼 비정상 입력 */
const ODD_INPUTS: [string, unknown][] = [
  ['null', null],
  ['undefined', undefined],
  ['빈 문자열', ''],
  ['공백 문자열', '   '],
  ['일반 문자열', 'not json'],
  ['숫자', 42],
  ['불리언', true],
  ['배열', [1, 2, 3]],
  ['빈 객체', {}],
]

describe('isApiResponse', () => {
  it('성공 래퍼를 식별한다', () => {
    expect(isApiResponse(WRAPPER)).toBe(true)
  })

  it('에러 래퍼(data: null)도 래퍼로 식별한다', () => {
    expect(isApiResponse(WRAPPER_ERROR)).toBe(true)
  })

  it('code가 200이 아니어도 래퍼다 — 로그인 성공 code 101/201', () => {
    expect(isApiResponse({ message: 'ok', data: {}, code: 101 })).toBe(true)
    expect(isApiResponse({ message: 'ok', data: {}, code: 201 })).toBe(true)
  })

  it('ProblemDetails는 래퍼가 아니다', () => {
    expect(isApiResponse(PROBLEM_VALIDATION)).toBe(false)
    expect(isApiResponse(PROBLEM_SERVER)).toBe(false)
  })

  it('data 키가 없으면 래퍼가 아니다', () => {
    expect(isApiResponse({ message: 'ok', code: 200 })).toBe(false)
  })

  it('code가 문자열이면 래퍼가 아니다', () => {
    expect(isApiResponse({ message: 'ok', data: {}, code: '200' })).toBe(false)
  })
})

describe('isProblemDetails', () => {
  it('유효성 오류를 식별한다', () => {
    expect(isProblemDetails(PROBLEM_VALIDATION)).toBe(true)
  })

  it('서버 오류를 식별한다', () => {
    expect(isProblemDetails(PROBLEM_SERVER)).toBe(true)
  })

  it('래퍼는 ProblemDetails가 아니다', () => {
    expect(isProblemDetails(WRAPPER)).toBe(false)
    expect(isProblemDetails(WRAPPER_ERROR)).toBe(false)
  })

  it('type·traceId가 없어도 title+status만 있으면 식별한다', () => {
    expect(isProblemDetails({ title: 'Bad Request', status: 400 })).toBe(true)
  })

  it('status가 문자열이면 아니다', () => {
    expect(isProblemDetails({ title: 'Bad Request', status: '400' })).toBe(false)
  })
})

describe('isEmptyBody', () => {
  it('null·undefined·빈 문자열·공백 문자열을 빈 것으로 본다', () => {
    expect(isEmptyBody(null)).toBe(true)
    expect(isEmptyBody(undefined)).toBe(true)
    expect(isEmptyBody('')).toBe(true)
    expect(isEmptyBody('   ')).toBe(true)
  })

  it('내용이 있으면 빈 것이 아니다', () => {
    expect(isEmptyBody(WRAPPER)).toBe(false)
    expect(isEmptyBody(PROBLEM_VALIDATION)).toBe(false)
    expect(isEmptyBody('x')).toBe(false)
    expect(isEmptyBody(0)).toBe(false)
    expect(isEmptyBody({})).toBe(false)
  })
})

describe('세 함수 모두 어떤 입력에도 throw하지 않는다', () => {
  // 빈 body를 파싱하려다 터지는 것이 이 모듈이 막으려는 사고다.
  it.each(ODD_INPUTS)('%s 입력에서 예외가 없다', (_label, input) => {
    expect(() => isApiResponse(input)).not.toThrow()
    expect(() => isProblemDetails(input)).not.toThrow()
    expect(() => isEmptyBody(input)).not.toThrow()
  })

  it.each(ODD_INPUTS)('%s 입력은 래퍼도 ProblemDetails도 아니다', (_label, input) => {
    expect(isApiResponse(input)).toBe(false)
    expect(isProblemDetails(input)).toBe(false)
  })
})
