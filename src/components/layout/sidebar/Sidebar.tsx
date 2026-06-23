import { ShieldBanIcon } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { SidebarGroup } from './SidebarGroup'
import { SidebarToggle } from './SidebarToggle'
import { ServiceMenus, AdminMenus } from './sidebar.config'
import { isAdminArea } from '@/router/paths'

/**
 * 좌측 사이드바.
 * - 영역 자동 분기: `/admin/*` → AdminMenus / 그 외 → ServiceMenus (006 spec §3 US2)
 * - 본사(admin) 영역에서는 헤더 옆에 `ADMIN` 뱃지 노출 (layout.md §2-1)
 */
export const Sidebar = () => {
  const location = useLocation()
  const admin = isAdminArea(location.pathname)
  const menus = admin ? AdminMenus : ServiceMenus

  return (
    <div className="w-70 h-full border-r flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="w-fit aspect-square p-1 rounded-sm bg-primary">
          <ShieldBanIcon className="text-primary-foreground" size={24} />
        </div>
        <span className="text-base font-semibold">PATROL</span>
        {admin && (
          <span className="ml-auto text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
            ADMIN
          </span>
        )}
      </div>

      {/* 메뉴 */}
      <div className="flex-1 flex flex-col gap-2 py-4">
        {menus.map((v, i) => (
          <SidebarGroup key={i} group={v} />
        ))}
      </div>
      {/* 푸터 */}
      <SidebarToggle isOpen={true} />
    </div>
  )
}
