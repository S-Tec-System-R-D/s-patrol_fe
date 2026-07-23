import { AdminMenus } from './sidebar.config'

/**
 * 라우트 → 메뉴명 lookup. **본사(`/admin/*`) 전용** — TopNav는 `AdminLayout`에서만 렌더된다(007).
 * 현장 사이트는 TopNav 없음(RailSidebar가 hover 툴팁으로 라벨 노출).
 * - 매칭 우선순위: 정확 매칭(`pathname === url`) > prefix 매칭(`activeUrl[i]`로 startsWith)
 * - 비매칭 시 빈 문자열 반환
 *
 * 006 spec §3 D2 — sidebar.config에서 자동 도출(DRY)
 */
export const getMenuTitle = (pathname: string): string => {
  for (const group of AdminMenus) {
    for (const item of group.groups) {
      if (pathname === item.url) return item.title
    }
  }

  for (const group of AdminMenus) {
    for (const item of group.groups) {
      const candidates = item.activeUrl ?? [item.url]
      if (candidates.some((u) => pathname.startsWith(u))) return item.title
    }
  }

  return ''
}
