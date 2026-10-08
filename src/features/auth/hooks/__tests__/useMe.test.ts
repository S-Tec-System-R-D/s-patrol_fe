import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import axios from 'axios'
import { useMe } from '@/features/auth/hooks/useMe'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { setAccessToken, clearTokens } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'
import api from '@/lib/axios'

describe('useMe', () => {
  beforeEach(() => {
    clearTokens()
  })

  it('유효한 토큰에서 MeDto를 반환한다', () => {
    setAccessToken(makeAccessToken({ userSeq: '42', userName: '김현장' }))

    const { result } = renderHook(() => useMe())

    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual({
      userSeq: 42,
      name: '김현장',
      role: 'FIELD_MANAGER',
    })
  })

  it('role 클레임에 따라 Role을 매핑한다', () => {
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'SystemManager' }))

    const { result } = renderHook(() => useMe())

    expect(result.current.data?.role).toBe('SYSTEM')
  })

  /**
   * 021: 사업장명은 **클레임이 아니라 선택 결과**에서 온다. 서버는 고른 siteSeq를
   * 기억하지 않고 토큰에도 담지 않으므로, 로컬 저장값이 유일한 출처다.
   */
  it('locationName은 선택한 사업장명을 반환한다 (021)', () => {
    setAccessToken(makeAccessToken())
    setSite(8, '강동 그랜드타워')

    const { result } = renderHook(() => useMe())

    expect(result.current.data?.locationName).toBe('강동 그랜드타워')
  })

  it('사업장 미선택이면 locationName은 undefined다', () => {
    setAccessToken(makeAccessToken())

    const { result } = renderHook(() => useMe())

    expect(result.current.data?.locationName).toBeUndefined()
  })

  /**
   * groupName은 021에서도 채우지 않는다 — 현장관리자·근무자는 사업장에만 소속되고
   * 그룹에는 소속되지 않는다(api-spec.md §2-2). 본사 계정 영역은 Phase 5.
   */
  it('groupName은 여전히 undefined다', () => {
    setAccessToken(makeAccessToken())
    setSite(8, '강동 그랜드타워')

    const { result } = renderHook(() => useMe())

    expect(result.current.data?.groupName).toBeUndefined()
  })

  it.each([
    ['토큰 없음', null],
    ['JWT 형식 아님', 'not-a-jwt'],
    ['payload가 비 JSON', `aaa.${btoa('nope')}.ccc`],
  ])('사용자를 특정할 수 없으면 isError (%s)', (_label, token) => {
    if (token) setAccessToken(token)

    const { result } = renderHook(() => useMe())

    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('실측된 Master role 을 MASTER 로 매핑한다 (022 Phase 8 R1)', () => {
    // 🔴 매핑이 없던 동안 Master 계정은 로그인에 성공해도 여기서 isError 가 되어
    // AuthGuard 가 로그인 화면으로 되돌렸다 — 들어갈 수 없었다.
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'Master', userName: '마스터' }))

    const { result } = renderHook(() => useMe())

    expect(result.current.isError).toBe(false)
    expect(result.current.data?.role).toBe('MASTER')
  })

  // 토큰은 멀쩡하지만 role 문자열이 미실측이거나(Manager) 의도적으로 매핑하지 않은
  // 값(FieldWorker — 근무자는 WEB 접근 불가)인 경우. 권한을 특정할 수 없으므로 통과 금지.
  it.each(['Manager', 'Worker', 'FieldWorker'])(
    '매핑에 없는 role(%s)은 isError — 권한 없음 처리',
    (jwtRole) => {
      setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: jwtRole }))

      const { result } = renderHook(() => useMe())

      expect(result.current.isError).toBe(true)
      expect(result.current.data).toBeUndefined()
    }
  )

  it('isLoading은 항상 false다 — 동기 훅이라 로딩 상태가 없다', () => {
    setAccessToken(makeAccessToken())

    const { result } = renderHook(() => useMe())

    expect(result.current.isLoading).toBe(false)
  })

  it('같은 토큰이면 같은 data 참조를 유지한다 (불필요한 재계산 방지)', () => {
    setAccessToken(makeAccessToken())

    const { result, rerender } = renderHook(() => useMe())
    const first = result.current.data
    rerender()

    expect(result.current.data).toBe(first)
  })
})

describe('useMe — 네트워크', () => {
  // 019까지는 실재하지 않는 GET /api/auth/me를 호출했다. 그 호출이 완전히 사라졌음을
  // adapter 수준에서 고정한다. 핸들러가 남아 있어도 호출하지 않는다는 것이 020의 요점이다.
  const adapterSpy = vi.fn()

  beforeEach(() => {
    clearTokens()
    adapterSpy.mockClear()
    adapterSpy.mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })
    api.defaults.adapter = adapterSpy
    axios.defaults.adapter = adapterSpy
  })

  afterEach(() => {
    delete api.defaults.adapter
    delete axios.defaults.adapter
  })

  it('렌더 시 어떤 HTTP 요청도 보내지 않는다', () => {
    setAccessToken(makeAccessToken())

    renderHook(() => useMe())

    expect(adapterSpy).not.toHaveBeenCalled()
  })
})
