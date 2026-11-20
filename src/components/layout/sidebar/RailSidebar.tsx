import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { NavLink, useLocation } from 'react-router-dom'
import { Building2Icon } from 'lucide-react'
import { useMe } from '@/features/auth/hooks/useMe'
import { roleLabel } from '@/types/enum'
import { LogoutButton } from './LogoutButton'
import { SiteSwitchField, type SiteSwitchProps } from './SiteSwitchButton'
import type { MenuItemType } from './sidebar.config'

interface RailSidebarProps {
  menus: MenuItemType[]
  /** 로고 옆 사이트 태그(본사 `ADMIN`). 현장은 없다 */
  tag?: string
  /**
   * 메뉴 건수 — 키는 `MenuItemType.badge`. 🔴 **숫자를 세는 훅은 레이아웃이 부른다**(`spec 043` T743) —
   * 사이드바가 직접 부르면 본사에서도 배치 요약(`GetAssignmentCount`)이 나간다. `undefined` 면 그리지 않는다
   * (실패·로딩 — 숫자를 지어내지 않는다).
   */
  badges?: Partial<Record<NonNullable<MenuItemType['badge']>, number>>
  /**
   * 사업장 전환(`spec 061`) — 있으면 사업장 칸이 버튼이 된다. 🔴 **목록 조회는 `ServiceLayout` 이 한다** —
   * 사이드바는 본사와 공용이고, 본사 토큰으로 `UserSiteSelect` 를 부르면 403 이다.
   */
  siteSwitch?: SiteSwitchProps
  /** 지금 사업장 이름(현장). 선택지가 하나뿐이면 `siteSwitch` 없이 이것만 온다 — 이름만 보이고 눌리지 않는다 */
  siteName?: string | null
}

/**
 * 224px 밝은 사이드바 — 현장(`ServiceLayout`)·본사(`AdminLayout`) 공용.
 * 🔄 **`spec 083`**: 68px 어두운 아이콘 레일(이름은 툴팁)에서 바꿨다 — 이름이 늘 보인다.
 * - 위: 로고 + `S-Patrol`(+ 본사 `ADMIN`) → 사업장 칸(현장만) → 메뉴(묶음 제목 `group` · 아이콘 + 이름 · 건수 알약).
 * - 아래: 사용자 이름 · 권한 + 로그아웃.
 * - 🔴 `xl` 이상에서만 보인다 — 미만은 하단 `FloatingNav`(`spec 053`).
 * - 🔴 이름이 글자로 보여도 링크의 `aria-label` 을 남긴다 — 건수가 접근 이름에 섞이지 않게(`배치관리 3` 이 아니라 `배치관리`).
 */
export const RailSidebar = ({ menus, tag, badges, siteSwitch, siteName }: RailSidebarProps) => {
  const location = useLocation()
  const { data: me } = useMe()

  return (
    <div className="hidden xl:flex w-56 shrink-0 h-screen sticky top-0 flex-col px-2 pt-3 pb-2">
      {/* 로고 */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <span className="grid size-[22px] place-items-center rounded-md bg-point text-xs font-bold text-white">
          S
        </span>
        <span className="text-[14px] font-semibold text-foreground">S-Patrol</span>
        {tag && (
          <span className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground">{tag}</span>
        )}
      </div>

      {/* 사업장 칸 — 현장만 */}
      {siteSwitch ? (
        <SiteSwitchField {...siteSwitch} />
      ) : (
        siteName && (
          <div className="mb-2.5 flex h-[30px] items-center gap-1.5 rounded-[7px] border border-border bg-card px-2 font-medium text-foreground">
            <Building2Icon size={14} className="shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{siteName}</span>
          </div>
        )
      )}

      {/* 메뉴 */}
      <nav aria-label="메뉴" className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {menus.map((item, index) => {
          const { icon: Icon, title, url, activeUrl, badge, group } = item
          const isActive = activeUrl
            ? activeUrl.some((u) => location.pathname.startsWith(u))
            : location.pathname.startsWith(url)
          const count = badge ? badges?.[badge] : undefined
          const startsGroup = group !== undefined && group !== menus[index - 1]?.group

          return (
            <Fragment key={url}>
              {startsGroup && (
                <div className={cn('px-2 pb-1 text-[11px] text-muted-foreground', index > 0 ? 'pt-3' : 'pt-1')}>
                  {group}
                </div>
              )}
              <NavLink
                to={url}
                aria-label={title}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-[30px] items-center gap-2 rounded-md px-2',
                  isActive
                    ? 'bg-sidebar-accent font-medium text-foreground'
                    : 'text-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground'
                )}
              >
                <Icon
                  size={14}
                  strokeWidth={2}
                  className={cn('shrink-0', isActive ? 'text-point' : 'text-muted-foreground')}
                />
                <span className="min-w-0 flex-1 truncate">{title}</span>
                {!!count && count > 0 && (
                  <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-point px-1.5 text-label font-semibold text-white tabular-nums">
                    {count}
                  </span>
                )}
              </NavLink>
            </Fragment>
          )
        })}
      </nav>

      {/* 사용자 + 로그아웃 */}
      <div className="flex items-center gap-2 px-2 pt-2">
        <div className="min-w-0 flex-1">
          {me && (
            <>
              <p className="truncate font-medium text-foreground">{me.name}</p>
              <p className="truncate text-caption text-muted-foreground">{roleLabel[me.role]}</p>
            </>
          )}
        </div>
        <LogoutButton tooltipSide="top" variant="inline" />
      </div>
    </div>
  )
}
