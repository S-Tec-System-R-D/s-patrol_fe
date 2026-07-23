import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { TopNav } from './topnav'

/**
 * 본사 사이트(`/admin/*`) 셸. 리디자인 미적용 — 기존 스펙(006) 구조 그대로.
 * 구조 (PC, lg 이상)
 * SideBar | TopNav
 *         | Contents
 *
 * lg 미만(<1024px): Sidebar는 hidden, MobileSidebar(TopNav 좌측 햄버거 + Sheet)로 대체.
 */
const AdminLayout = () => {
  return (
    <div className="app-shell">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <div className="flex flex-col min-h-0 flex-1">
        <TopNav />
        <div className="flex flex-1  bg-contents-background overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
