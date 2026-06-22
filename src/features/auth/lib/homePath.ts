/**
 * Role → 본인 영역 홈 경로 매핑.
 * - 403/404 페이지의 "본인 영역 홈으로" 액션에서 사용.
 * - Admin 3종(SYSTEM/MASTER/MANAGER) → /admin/locations
 * - 현장관리자(FIELD_MANAGER) → /zones (코스 관리 = 현장 1차 화면)
 * - 근무자(WORKER) → /login (WEB 진입 자체 차단 대상. fallback)
 *
 * 005 spec §3 비즈니스 규칙.
 */

import type { Role } from '@/types/enum'
import { paths } from '@/router/paths'

export const homePath = (role: Role): string => {
  switch (role) {
    case 'SYSTEM':
    case 'MASTER':
    case 'MANAGER':
      return paths.admin.locations
    case 'FIELD_MANAGER':
      return paths.service.zones
    case 'WORKER':
    default:
      return paths.serviceLogin
  }
}
