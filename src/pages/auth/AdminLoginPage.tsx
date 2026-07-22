import AppButton from '@/components/app/AppButton'
import { homePath } from '@/features/auth/lib/homePath'
import {
  DEV_ROLE_KEY,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth/tokens'
import type { AdminRole } from '@/types/enum'
import { roleLabel } from '@/types/enum'

/**
 * 본사 로그인 placeholder.
 * - 005에서 `/admin/login` 라우트 누락 보완용. AuthGuard의 admin 영역 리다이렉트 착지점.
 * - 실 로그인 폼은 Phase 5 본사 영역 spec에서 함께 구현.
 * - 그 전까지 개발 진입용 임시 버튼: 관리자 role 3종으로 토큰 심고 홈으로 이동.
 */

const ADMIN_ROLES: readonly AdminRole[] = ['SYSTEM', 'MASTER', 'MANAGER']

const devSignInAs = (role: AdminRole) => {
  localStorage.setItem(DEV_ROLE_KEY, role)
  setAccessToken(`dev-access-${Date.now()}`)
  setRefreshToken(`dev-refresh-${Date.now()}`)
  window.location.assign(homePath(role))
}

const AdminLoginPage = () => {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">본사 로그인</h1>
          <p className="text-xs text-muted-foreground">개발용 임시 진입 (Phase 5에서 실폼 교체)</p>
        </div>
        <div className="space-y-2">
          {ADMIN_ROLES.map((role) => (
            <AppButton
              key={role}
              size="full"
              variant={role === 'SYSTEM' ? 'default' : 'sub'}
              onClick={() => devSignInAs(role)}
            >
              {roleLabel[role]}로 진입
            </AppButton>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
