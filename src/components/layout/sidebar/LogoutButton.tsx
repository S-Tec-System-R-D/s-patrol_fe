import { useState } from 'react'
import { LogOutIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppAlertDialog from '@/components/AppAlertDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMe } from '@/features/auth/hooks/useMe'
import { clearTokens } from '@/lib/auth/tokens'
import { isAdminArea, paths } from '@/router/paths'

interface LogoutButtonProps {
  /** 툴팁 방향 — 레일 `right` · 하단 floating nav `top` */
  tooltipSide: 'right' | 'top'
}

/**
 * 레일 · floating nav 하단의 로그아웃 버튼(`spec 053`). 전에는 프로필 드롭다운(`ProfileBadge`)이었는데
 * 실제로 동작하는 항목이 로그아웃 하나뿐이라(내 정보 = 비활성 자리표시) 버튼으로 줄였다.
 *
 * 🔴 **바로 로그아웃하지 않고 확인 모달을 거친다** — 하단 바는 엄지가 자주 닿는 자리라 잘못 누르면 작업 중에 튕긴다.
 * 드롭다운이 보여주던 사용자 이름은 툴팁 · 모달 문구로 옮겼다.
 *
 * 로그아웃: 토큰 clear + 영역별 로그인 이동. 토큰이 사라지면 `useMe` 가 바로 `isError` 가 되므로
 * 별도 캐시 무효화가 필요 없다(020).
 */
export const LogoutButton = ({ tooltipSide }: LogoutButtonProps) => {
  const { data } = useMe()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    clearTokens()
    const loginPath = isAdminArea(location.pathname) ? paths.adminLogin : paths.serviceLogin
    navigate(loginPath, { replace: true })
  }

  const name = data?.name

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="로그아웃"
            onClick={() => setOpen(true)}
            className="w-11 h-11 rounded-[10px] grid place-items-center text-rail-icon hover:text-white cursor-pointer"
          >
            <LogOutIcon size={20} strokeWidth={1.5} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{name ? `${name} · 로그아웃` : '로그아웃'}</TooltipContent>
      </Tooltip>
      <AppAlertDialog
        open={open}
        onOpenChange={setOpen}
        size="sm"
        icon={LogOutIcon}
        title="로그아웃하시겠습니까?"
        description={name ? `${name} 님 계정에서 로그아웃합니다.` : undefined}
        actionLabel="로그아웃"
        onAction={handleLogout}
      />
    </>
  )
}
