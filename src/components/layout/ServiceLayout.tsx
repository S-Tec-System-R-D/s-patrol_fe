import { Outlet } from 'react-router-dom'
import { RailSidebar } from './sidebar/RailSidebar'

/**
 * 현장 사이트(`/*`) 셸. 리디자인(007) 반영.
 * - TopNav 없음. 68px `RailSidebar`만.
 * - `.app-shell`(overflow:hidden) 미사용 — 페이지 자연 스크롤.
 * layout.md §0-1
 */
const ServiceLayout = () => {
  return (
    <div className="min-h-screen flex">
      <RailSidebar />
      <div className="flex-1 bg-contents-background">
        <Outlet />
      </div>
    </div>
  )
}

export default ServiceLayout
