import type { LucideIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/**
 * 계정 관리 자리 (`spec 045` T829) — 추가 · 수정 · 비밀번호 · 삭제는 **막는다**.
 *
 * 🔴 관리자 전용 API 가 없다(B-59 — 사용자가 백엔드에 요청 중). `AddUser`·`UpdateUser`·`RemoveUser` 는 현장용이라 쓰지
 * 않는다(사용자 결정 2026-10-23). 폼은 만들지 않았다 — API 가 오면 그 계약으로 만든다.
 * 열 때 화면이 걸 규칙(서버는 검사하지 않는다, B-60): 시스템관리자 → 마스터 · 마스터 → 매니저 생성 · 시스템관리자 계정 잠금.
 */

export const LOCKED_ACCOUNT_MESSAGE = '관리자 계정 관리는 아직 지원되지 않습니다'

interface LockedAccountButtonProps {
  icon: LucideIcon
  label: string
  variant?: 'default' | 'sub' | 'destructive'
  className?: string
}

const LockedAccountButton = ({ icon, label, variant = 'sub', className }: LockedAccountButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      {/* 🔴 disabled 버튼은 포인터 이벤트가 없어 툴팁이 안 뜬다 — 감싼 span 에 건다(044 `SiteManagersCard`) */}
      <span tabIndex={0} className={className}>
        <AppButton variant={variant} icon={icon} iconSize={14} disabled aria-label={label}>
          {label}
        </AppButton>
      </span>
    </TooltipTrigger>
    <TooltipContent>{LOCKED_ACCOUNT_MESSAGE}</TooltipContent>
  </Tooltip>
)

export default LockedAccountButton
