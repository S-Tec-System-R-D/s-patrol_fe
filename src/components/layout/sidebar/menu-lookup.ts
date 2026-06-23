import { ServiceMenus, AdminMenus, type MenuGroupType } from './sidebar.config'
import { isAdminArea } from '@/router/paths'

/**
 * 라우트 → 메뉴명 lookup.
 * - 영역 판별: `isAdminArea(pathname)` 기준으로 `ServiceMenus` 또는 `AdminMenus` 사용
 * - 매칭 우선순위: 정확 매칭(`pathname === url`) > prefix 매칭(`activeUrl[i]`로 startsWith)
 * - 비매칭 시 빈 문자열 반환
 *
 * 006 spec §3 D2 — sidebar.config에서 자동 도출(DRY)
 */
export const getMenuTitle = (pathname: string): string => {
  const menus: MenuGroupType[] = isAdminArea(pathname) ? AdminMenus : ServiceMenus

  for (const group of menus) {
    for (const item of group.groups) {
      if (pathname === item.url) return item.title
    }
  }

  for (const group of menus) {
    for (const item of group.groups) {
      const candidates = item.activeUrl ?? [item.url]
      if (candidates.some((u) => pathname.startsWith(u))) return item.title
    }
  }

  return ''
}
