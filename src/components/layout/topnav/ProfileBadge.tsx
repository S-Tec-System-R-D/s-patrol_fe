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

/**
 * 우상단 프로필 뱃지 + 드롭다운.
 * - useMe 캐시 공유. 별도 fetch 없음.
 * - 메뉴: 사용자명(disabled label) / 내 정보(placeholder) / 로그아웃
 * - 로그아웃: 토큰 clear + meQueryKey invalidate + 영역별 로그인 이동
 */
export const ProfileBadge = () => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="프로필 메뉴 열기"
        className="aspect-square border rounded-full p-2 bg-gradient-to-r from-pink-400 to-blue-800 cursor-pointer"
      >
        <UserIcon size={20} className="text-white" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
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
