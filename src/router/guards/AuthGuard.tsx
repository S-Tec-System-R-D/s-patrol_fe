import { Navigate, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout'
import { useMe } from '@/features/auth/hooks/useMe'
import { getAccessToken } from '@/lib/auth/tokens'
import { paths, isAdminArea } from '@/router/paths'

/**
 * 보호 라우트 진입 가드.
 * - 토큰 없음 → 영역별 로그인 화면으로 Navigate(`?redirect=` 보존)
 * - 토큰 있음 + useMe 로딩 → null 렌더(깜빡임 방지)
 * - 토큰 있음 + useMe 실패 → 인터셉터 refresh도 실패한 상태. 안전을 위해 로그인으로 Navigate
 * - 토큰 있음 + useMe 성공 → `<AppLayout />`
 *
 * 005 spec §3 비즈니스 규칙.
 */
const AuthGuard = () => {
  const location = useLocation()
  const hasToken = getAccessToken() !== null
  const { data, isLoading, isError } = useMe()

  if (!hasToken) {
    const loginPath = isAdminArea(location.pathname) ? paths.adminLogin : paths.serviceLogin
    const target = `${loginPath}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }

  if (isLoading) return null

  if (isError || !data) {
    const loginPath = isAdminArea(location.pathname) ? paths.adminLogin : paths.serviceLogin
    const target = `${loginPath}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }

  return <AppLayout />
}

export default AuthGuard
