import { cn } from '@/lib/utils'
import { NavLink, useLocation } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProfileBadge } from '../topnav/ProfileBadge'
import { ServiceMenus } from './sidebar.config'

/**
 * 현장 사이트(`/*`) 전용 68px 다크 아이콘 레일.
 * - 그룹 헤더 없음, `ServiceMenus`(flat 5개)를 그대로 순회.
 * - 라벨은 hover/포커스 시 우측 툴팁으로만 노출.
 * - 하단 프로필 아바타는 `ProfileBadge`(`variant="rail"`) 재사용(드롭다운 우측 오픈).
 * layout.md §2-A. 아이템 치수·색상은 목업 CSS 그대로 이식(007 수정).
 */
export const RailSidebar = () => {
  const location = useLocation()

  return (
    <div className="w-[68px] shrink-0 h-screen sticky top-0 bg-rail flex flex-col items-center pt-[18px] pb-5">
      {/* 로고 */}
      <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-point to-point-foreground flex items-center justify-center text-primary-foreground text-xs font-bold">
        SP
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full mt-6">
        {ServiceMenus.map((item) => {
          const { icon: Icon, title, url, activeUrl, badge } = item
          const isActive = activeUrl
            ? activeUrl.some((u) => location.pathname.startsWith(u))
            : location.pathname.startsWith(url)
          const count = badge?.()

          return (
            <Tooltip key={url}>
              <TooltipTrigger asChild>
                <NavLink
                  to={url}
                  aria-label={title}
                  className={cn(
                    'relative w-11 h-11 rounded-[10px] grid place-items-center',
                    isActive ? 'bg-rail-2 text-white' : 'text-rail-icon hover:text-white'
                  )}
                >
                  {isActive && (
                    <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-[2px] bg-point" />
                  )}
                  <Icon size={20} strokeWidth={1.5} />
                  {!!count && count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-danger text-danger-foreground text-[9px] leading-3.5 text-center">
                      {count}
                    </span>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      {/* 알림 버튼 예약 슬롯 (현재 비어 있음, layout.md §2-A) */}
      <div className="w-full h-8" />

      {/* 프로필 */}
      <ProfileBadge side="right" align="end" variant="rail" />
    </div>
  )
}
