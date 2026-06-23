import { useLocation } from 'react-router-dom'
import { AlarmSheet } from './AlarmSheet'
import { ProfileBadge } from './ProfileBadge'
import { MobileSidebar } from '../sidebar/MobileSidebar'
import { getMenuTitle } from '../sidebar/menu-lookup'

/**
 * 상단 네비게이션 바.
 * - 좌측: (lg 미만) 햄버거 + 현재 메뉴명
 * - 우측: 알림 / 프로필
 *
 * 메뉴명은 라우트에 따라 sidebar.config(`ServiceMenus` / `AdminMenus`)에서 자동 도출.
 * 비매칭 경로(예: `/403`, `/404`)는 빈 문자열.
 */
export const TopNav = () => {
  const location = useLocation()
  const title = getMenuTitle(location.pathname)

  return (
    <div className="w-full flex border-b py-2 px-4 items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <MobileSidebar />
        <span className="font-medium truncate">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <AlarmSheet />
        <ProfileBadge />
      </div>
    </div>
  )
}
