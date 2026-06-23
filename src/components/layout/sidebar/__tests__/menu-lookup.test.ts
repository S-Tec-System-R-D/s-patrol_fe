import { describe, expect, it } from 'vitest'
import { getMenuTitle } from '../menu-lookup'

describe('getMenuTitle', () => {
  it('현장 정확 매칭 — /zones → "구역/지점"', () => {
    expect(getMenuTitle('/zones')).toBe('구역/지점')
  })

  it('현장 prefix 매칭 — /points → "구역/지점" (activeUrl)', () => {
    expect(getMenuTitle('/points')).toBe('구역/지점')
  })

  it('현장 prefix 매칭 — /patrol/zones → "순찰이력"', () => {
    expect(getMenuTitle('/patrol/zones')).toBe('순찰이력')
  })

  it('본사 정확 매칭 — /admin/locations → "사업장 관리"', () => {
    expect(getMenuTitle('/admin/locations')).toBe('사업장 관리')
  })

  it('본사 prefix 매칭 — /admin/locations/abc → "사업장 관리"', () => {
    expect(getMenuTitle('/admin/locations/abc')).toBe('사업장 관리')
  })

  it('비매칭 경로 — /403 → 빈 문자열', () => {
    expect(getMenuTitle('/403')).toBe('')
  })

  it('비매칭 경로 — /zzz → 빈 문자열', () => {
    expect(getMenuTitle('/zzz')).toBe('')
  })
})
