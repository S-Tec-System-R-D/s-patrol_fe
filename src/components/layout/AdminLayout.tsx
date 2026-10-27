import { Outlet } from 'react-router-dom'
import { FloatingNav } from './sidebar/FloatingNav'
import { RailSidebar } from './sidebar/RailSidebar'
import { AdminMenus } from './sidebar/sidebar.config'

/**
 * 본사 사이트(`/admin/*`) 셸 — 현장과 같은 68px 레일(`spec 043` US1) · `xl` 미만 하단 `FloatingNav`(`spec 053`).
 * - TopNav 없음 · 페이지 자연 스크롤 · 페이지가 자기 헤더를 그린다(현장과 같은 규칙).
 * - 레일: `ADMIN` 태그 · 메뉴 2개. 본사 계정은 현장 사이트로 이동하지 않는다(사용자 결정 2026-10-23 — US4 철회).
 * - 🔴 배치 대기 뱃지 훅을 부르지 않는다 — 본사에서 `GetAssignmentCount` 가 나가면 안 된다.
 * - 콘텐츠 `pb-24 xl:pb-0` · `min-h-screen` 은 `ServiceLayout` 과 같은 이유.
 * layout.md §0-2
 */
const AdminLayout = () => {
  return (
    <div className="flex">
      <RailSidebar menus={AdminMenus} tag="ADMIN" />
      <div className="flex-1 min-w-0 min-h-screen pb-24 xl:pb-0 bg-contents-background">
        <Outlet />
      </div>
      <FloatingNav menus={AdminMenus} />
    </div>
  )
}

export default AdminLayout
