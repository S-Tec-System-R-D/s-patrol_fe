import { cn } from '@/lib/utils'
import { NavLink, useLocation } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LogoutButton } from './LogoutButton'
import { SiteSwitchButton, type SiteSwitchProps } from './SiteSwitchButton'
import type { MenuItemType } from './sidebar.config'

interface RailSidebarProps {
  menus: MenuItemType[]
  /** 로고 아래 사이트 태그(본사 `ADMIN`). 현장은 없다 */
  tag?: string
  /**
   * 메뉴 뱃지 숫자 — 키는 `MenuItemType.badge`. 🔴 **숫자를 세는 훅은 레이아웃이 부른다**(`spec 043` T743) —
   * 레일이 직접 부르면 본사에서도 배치 요약(`GetAssignmentCount`)이 나간다. `undefined` 면 뱃지를 그리지 않는다
   * (실패·로딩 — 숫자를 지어내지 않는다).
   */
  badges?: Partial<Record<NonNullable<MenuItemType['badge']>, number>>
  /**
   * 사업장 전환(`spec 061`) — 있으면 로그아웃 위에 버튼. 🔴 **목록 조회는 `ServiceLayout` 이 한다** —
   * 레일은 본사와 공용이고, 본사 토큰으로 `UserSiteSelect` 를 부르면 403 이다.
   */
  siteSwitch?: SiteSwitchProps
}

/**
 * 68px 다크 아이콘 레일 — 현장(`ServiceLayout`)·본사(`AdminLayout`) 공용(`spec 043`).
 * - 그룹 헤더 없음, `menus`(flat)를 그대로 순회.
 * - 라벨은 hover/포커스 시 우측 툴팁으로만 노출.
 * - 하단은 사업장 전환(현장 · 복수 소속만 — `spec 061`) + 로그아웃 버튼(`spec 053` — 프로필 드롭다운 제거).
 * - 🔴 `xl` 이상에서만 보인다 — 미만은 하단 `FloatingNav`(`spec 053`).
 * layout.md §2-A. 아이템 치수·색상은 목업 CSS 그대로 이식(007 수정).
 */
export const RailSidebar = ({ menus, tag, badges, siteSwitch }: RailSidebarProps) => {
  const location = useLocation()

  return (
    <div className="hidden xl:flex w-[68px] shrink-0 h-screen sticky top-0 bg-rail flex-col items-center pt-[18px] pb-5">
      {/* 로고 */}
      <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-point to-point-foreground flex items-center justify-center text-primary-foreground text-xs font-bold">
        SP
      </div>
      {tag && (
        <div className="mt-[7px] text-[9px] font-bold tracking-[0.08em] text-rail-icon">{tag}</div>
      )}

      {/* 메뉴 */}
      <nav aria-label="메뉴" className="flex-1 flex flex-col items-center gap-1 w-full mt-6">
        {menus.map((item) => {
          const { icon: Icon, title, url, activeUrl, badge } = item
          const isActive = activeUrl
            ? activeUrl.some((u) => location.pathname.startsWith(u))
            : location.pathname.startsWith(url)
          const count = badge ? badges?.[badge] : undefined

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
                    <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-danger text-white text-[9px] leading-3.5 text-center">
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

      {/* 알림 버튼 예약 자리 (layout.md §2-A) */}
      <div className="w-full h-8" />

      {siteSwitch && <SiteSwitchButton tooltipSide="right" {...siteSwitch} />}
      <LogoutButton tooltipSide="right" />
    </div>
  )
}
