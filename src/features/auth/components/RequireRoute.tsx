import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/features/auth/hooks/useMe'
import type { Role } from '@/types/enum'
import { paths } from '@/router/paths'

interface RequireRouteProps {
  roles: Role[]
  children: ReactNode
}

/**
 * 라우트 단위 권한 가드.
 * - UI 액션용 `<RequireRole>`은 fallback 렌더 패턴, 본 컴포넌트는 redirect 패턴(다른 책임).
 * - `useMe()` 캐시 공유. 별도 fetch 안 함.
 * - 분기:
 *   - 로딩 → null (AuthGuard에서 이미 인증 통과 후 진입한다고 가정. 짧은 깜빡임 허용)
 *   - 미인증(data 없음) → `/login` (예외 케이스 방어. 정상 흐름에선 AuthGuard가 먼저 차단)
 *   - role 불일치 → `/403`
 *   - role 일치 → children
 *
 * 005 spec §3 비즈니스 규칙 D3.
 */
export const RequireRoute = ({ roles, children }: RequireRouteProps) => {
  const { data, isLoading } = useMe()
  const location = useLocation()

  if (isLoading) return null

  if (!data) {
    const target = `${paths.serviceLogin}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }

  if (!roles.includes(data.role)) {
    return <Navigate to={paths.forbidden} replace />
  }

  return <>{children}</>
}
