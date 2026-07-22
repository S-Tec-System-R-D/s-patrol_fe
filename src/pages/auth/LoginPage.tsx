import AppButton from '@/components/app/AppButton'
import { homePath } from '@/features/auth/lib/homePath'
import {
  DEV_ROLE_KEY,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth/tokens'

/**
 * 현장 로그인 placeholder.
 * - 실 로그인 폼은 Phase 3 `/login` spec에서 구현 (사번 6 + 비번 8).
 * - 그 전까지 개발 진입용 임시 버튼: FIELD_MANAGER role로 토큰 심고 홈으로 이동.
 *   Phase 3 착수 시 이 파일 통째로 교체 예정.
 */

const devSignInAsField = () => {
  localStorage.setItem(DEV_ROLE_KEY, 'FIELD_MANAGER')
  setAccessToken(`dev-access-${Date.now()}`)
  setRefreshToken(`dev-refresh-${Date.now()}`)
  // useMe 캐시를 무효화하는 대신 하드 리로드 — 실 로그인 흐름과 동일하고 MSW도 재초기화.
  window.location.assign(homePath('FIELD_MANAGER'))
}

const LoginPage = () => {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">현장 로그인</h1>
          <p className="text-xs text-muted-foreground">개발용 임시 진입 (Phase 3에서 실폼 교체)</p>
        </div>
        <AppButton size="full" onClick={devSignInAsField}>
          현장관리자로 진입
        </AppButton>
      </div>
    </div>
  )
}

export default LoginPage
