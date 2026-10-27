import { cn } from '@/lib/utils'
import { NavLink, useLocation } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LogoutButton } from './LogoutButton'
import type { MenuItemType } from './sidebar.config'

interface FloatingNavProps {
  menus: MenuItemType[]
  /** 메뉴 뱃지 숫자 — `RailSidebar` 와 같은 값. 🔴 세는 훅은 레이아웃이 부른다(`spec 043` T743) */
  badges?: Partial<Record<NonNullable<MenuItemType['badge']>, number>>
}

/**
 * `xl` 미만 하단 floating nav — 현장 · 본사 공용(`spec 053`). `xl` 이상은 `RailSidebar`.
 * - 휴대폰 폭에서 68px 레일이 화면의 17% 를 먹어 레일 대신 하단에 띄운다.
 * - 🔴 `z-40` — 모달 · 시트(`z-50`)가 이 위를 덮는다.
 * - 활성 표시는 레일의 왼쪽 바 대신 아이콘 아래 점(가로 배치라 왼쪽 바가 어색하다).
 * - 콘텐츠가 가려지지 않게 하는 하단 여백은 레이아웃이 준다(`pb-24 xl:pb-0`).
 * layout.md §5-7.
 */
export const FloatingNav = ({ menus, badges }: FloatingNavProps) => {
  const location = useLocation()

  return (
    <nav
      aria-label="하단 메뉴"
      className="xl:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 rounded-2xl bg-rail shadow-[0_8px_24px_-6px_oklch(0_0_0_/_0.45)]"
    >
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
                <Icon size={20} strokeWidth={1.5} />
                {isActive && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-point" />
                )}
                {!!count && count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-danger text-white text-[9px] leading-3.5 text-center">
                    {count}
                  </span>
                )}
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="top">{title}</TooltipContent>
          </Tooltip>
        )
      })}

      <span aria-hidden className="mx-1 w-px h-6 bg-white/10" />

      <LogoutButton tooltipSide="top" />
    </nav>
  )
}
