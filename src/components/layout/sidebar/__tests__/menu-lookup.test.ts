import { describe, expect, it } from 'vitest'
import { getMenuTitle } from '../menu-lookup'

describe('getMenuTitle (본사 전용 — TopNav는 AdminLayout에서만 렌더, 007)', () => {
  it('본사 정확 매칭 — /admin/locations → "사업장 관리"', () => {
    expect(getMenuTitle('/admin/locations')).toBe('사업장 관리')
  })

  it('본사 prefix 매칭 — /admin/locations/abc → "사업장 관리"', () => {
    expect(getMenuTitle('/admin/locations/abc')).toBe('사업장 관리')
  })

  it('비매칭 경로 — /admin/zzz → 빈 문자열', () => {
    expect(getMenuTitle('/admin/zzz')).toBe('')
  })
})
