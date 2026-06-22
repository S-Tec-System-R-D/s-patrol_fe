import type { ReactNode } from 'react'
import { useMe } from '@/features/auth/hooks/useMe'
import type { Role } from '@/features/auth/types/me'

interface RequireRoleProps {
  roles: Role[]
  fallback?: ReactNode
  children: ReactNode
}

/**
 * UI 액션 권한 가드.
 * - `useMe()` 캐시를 공유. 별도 fetch를 일으키지 않는다.
 * - `roles`에 본인 role이 포함될 때만 children 렌더.
 * - 로딩 / 미인증(data 없음) / role 미일치 시 children 렌더 안 함(있으면 fallback).
 *
 * 라우트 단위 권한 분기는 본 컴포넌트가 아닌 AuthGuard(Phase 1) 책임.
 */
export const RequireRole = ({ roles, fallback = null, children }: RequireRoleProps) => {
  const { data, isLoading } = useMe()

  if (isLoading || !data) {
    return <>{fallback}</>
  }
  if (!roles.includes(data.role)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}
