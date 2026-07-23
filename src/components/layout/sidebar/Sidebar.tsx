import { ShieldBanIcon } from 'lucide-react'

import { SidebarGroup } from './SidebarGroup'
import { SidebarToggle } from './SidebarToggle'
import { AdminMenus } from './sidebar.config'

/**
 * 본사 사이트(`/admin/*`) 전용 사이드바. w-70, 텍스트 메뉴.
 * 현장 사이트는 `RailSidebar`(68px 아이콘 레일) 사용 — 007 리디자인에서 라우터 레벨로 분리.
 */
export const Sidebar = () => {
  return (
    <div className="w-70 h-full border-r flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="w-fit aspect-square p-1 rounded-sm bg-primary">
          <ShieldBanIcon className="text-primary-foreground" size={24} />
        </div>
        <span className="text-base font-semibold">PATROL</span>
        <span className="ml-auto text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
          ADMIN
        </span>
      </div>

      {/* 메뉴 */}
      <div className="flex-1 flex flex-col gap-2 py-4">
        {AdminMenus.map((v, i) => (
          <SidebarGroup key={i} group={v} />
        ))}
      </div>
      {/* 푸터 */}
      <SidebarToggle isOpen={true} />
    </div>
  )
}
