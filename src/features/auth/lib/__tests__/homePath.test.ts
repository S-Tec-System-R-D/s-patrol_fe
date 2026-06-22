import { describe, expect, it } from 'vitest'
import { homePath } from '../homePath'
import { paths } from '@/router/paths'

describe('homePath', () => {
  it('Admin 3종(SYSTEM/MASTER/MANAGER) → /admin/locations', () => {
    expect(homePath('SYSTEM')).toBe(paths.admin.locations)
    expect(homePath('MASTER')).toBe(paths.admin.locations)
    expect(homePath('MANAGER')).toBe(paths.admin.locations)
  })

  it('현장관리자(FIELD_MANAGER) → /zones', () => {
    expect(homePath('FIELD_MANAGER')).toBe(paths.service.zones)
  })

  it('근무자(WORKER) → /login (fallback)', () => {
    expect(homePath('WORKER')).toBe(paths.serviceLogin)
  })
})
