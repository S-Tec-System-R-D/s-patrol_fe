import { LogOutIcon, UserCircle2Icon, UserIcon } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMe, meQueryKey } from '@/features/auth/hooks/useMe'
import { clearTokens } from '@/lib/auth/tokens'
import { isAdminArea, paths } from '@/router/paths'

interface ProfileBadgeProps {
  /** 드롭다운이 트리거 기준 어느 쪽에 열릴지. 기본값(TopNav 우측 배치) = 'bottom' */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** 기본값(TopNav) = 'end' */
  align?: 'start' | 'center' | 'end'
  /** 트리거 비주얼. 'default' = TopNav 그라데이션 원형. 'rail' = RailSidebar 44px 박스 + 이니셜 아바타 + 온라인 dot */
  variant?: 'default' | 'rail'
}

/**
 * 프로필 뱃지 + 드롭다운. 본사 TopNav 우측 / 현장 RailSidebar 하단 양쪽에서 재사용.
 * - useMe 캐시 공유. 별도 fetch 없음.
 * - 메뉴: 사용자명(disabled label) / 내 정보(placeholder) / 로그아웃
 * - 로그아웃: 토큰 clear + meQueryKey invalidate + 영역별 로그인 이동
 */
export const ProfileBadge = ({
  side = 'bottom',
  align = 'end',
  variant = 'default',
}: ProfileBadgeProps = {}) => {
  const { data } = useMe()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    clearTokens()
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
    const loginPath = isAdminArea(location.pathname) ? paths.adminLogin : paths.serviceLogin
    navigate(loginPath, { replace: true })
  }

  const initial = data?.name?.slice(0, 1) ?? '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="프로필 메뉴 열기"
        className={
          variant === 'rail'
            ? 'cursor-pointer'
            : 'aspect-square border rounded-full p-2 bg-gradient-to-r from-pink-400 to-blue-800 cursor-pointer'
        }
      >
        {variant === 'rail' ? (
          <div className="relative w-11 h-11 rounded-[12px] bg-rail-2 border border-white/6 shadow-[0_6px_16px_-4px_oklch(0_0_0_/_0.5)] grid place-items-center">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-gradient-to-br from-pink-400 to-blue-800 grid place-items-center text-white text-[11px] font-semibold">
              {initial}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] rounded-full bg-success border-2 border-rail" />
          </div>
        ) : (
          <UserIcon size={20} className="text-white" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-48">
        <DropdownMenuLabel>{data?.name ?? '사용자'}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserCircle2Icon />
          내 정보
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
