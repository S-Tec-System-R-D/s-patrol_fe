import { Outlet } from 'react-router-dom'
import { FloatingNav } from './sidebar/FloatingNav'
import { RailSidebar } from './sidebar/RailSidebar'
import { TopBar } from './TopBar'
import { AdminMenus } from './sidebar/sidebar.config'

/**
 * 본사 사이트(`/admin/*`) 셸 — 현장과 같은 사이드바(`spec 043` US1 · 🔄 `spec 083` 224px 밝은 사이드바 + 본문 카드 한 장) · `xl` 미만 하단 `FloatingNav`(`spec 053`).
 * - TopNav 없음 · 페이지 자연 스크롤 · 페이지가 자기 헤더를 그린다(현장과 같은 규칙).
 * - 레일: `ADMIN` 태그 · 메뉴 2개. 본사 계정은 현장 사이트로 이동하지 않는다(사용자 결정 2026-10-23 — US4 철회).
 * - 🔴 배치 대기 뱃지 훅을 부르지 않는다 — 본사에서 `GetAssignmentCount` 가 나가면 안 된다.
 * - 콘텐츠 `pb-24 xl:pb-0` · `min-h-screen` 은 `ServiceLayout` 과 같은 이유.
 * layout.md §0-2
 */
const AdminLayout = () => {
  return (
    <div className="flex bg-contents-background">
      <RailSidebar menus={AdminMenus} tag="ADMIN" />
      {/* 본문 카드 한 장(`spec 083`) — `xl` 이상에서만 카드로 띄운다. 미만은 화면 전체를 쓴다(위 줄만 남는다) */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-card pb-24 xl:my-2 xl:mr-2 xl:min-h-[calc(100vh-1rem)] xl:rounded-xl xl:border xl:border-border xl:pb-0">
        <TopBar />
        <Outlet />
      </div>
      <FloatingNav menus={AdminMenus} />
    </div>
  )
}

export default AdminLayout
