import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/features/auth/hooks/useMe'
import { getAccessToken } from '@/lib/auth/tokens'
import { getSiteSeq } from '@/lib/auth/site'
import { paths, isAdminArea } from '@/router/paths'
import type { AdminRole, Role } from '@/types/enum'

const ADMIN_ROLES: readonly Role[] = ['SYSTEM', 'MASTER', 'MANAGER'] satisfies readonly AdminRole[]

/**
 * 보호 라우트 진입 가드.
 * - 토큰 없음 → 영역별 로그인 화면으로 Navigate(`?redirect=` 보존)
 * - 🔴 토큰 있음 + 현장 영역 + **본사 계정** → 본사 홈으로 Navigate (999 US2 — 본사는 현장 화면에 들어가지 않는다)
 * - 토큰 있음 + 현장 영역 + 사업장 미선택 → 로그인으로 Navigate (021)
 * - 토큰 있음 + useMe 로딩 → null 렌더(깜빡임 방지)
 * - 토큰 있음 + useMe 실패 → 인터셉터 refresh도 실패한 상태. 안전을 위해 로그인으로 Navigate
 * - 토큰 있음 + useMe 성공 → `<Outlet />` (셸은 라우터 하위의 `ServiceLayout`/`AdminLayout`이 담당 — 007)
 *
 * 005 spec §3 비즈니스 규칙.
 */
const AuthGuard = () => {
  const location = useLocation()
  const hasToken = getAccessToken() !== null
  const { data, isLoading, isError } = useMe()

  const isAdmin = isAdminArea(location.pathname)

  if (!hasToken) {
    const loginPath = isAdmin ? paths.adminLogin : paths.serviceLogin
    const target = `${loginPath}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }

  // 🔴 본사 계정은 현장 화면에 들어가지 않는다(사용자 결정 2026-10-23, spec 999 US2).
  //
  // 본사는 사업장을 고르지 않으므로(043) 아래 `siteSeq` 검사에 걸려 **현장 로그인으로 튕겼다** — 로그인된 사람에게
  // 로그인 화면을 보여 주는 셈이었다. 🔴 `siteSeq` 검사보다 **먼저** 본다 — 예전에 남은 `siteSeq` 가 있어도 본사 홈이다.
  if (!isAdmin && data && ADMIN_ROLES.includes(data.role)) {
    return <Navigate to={paths.admin.locations} replace />
  }

  // 🔴 사업장 미선택 차단(spec 021 §3 규칙 6).
  //
  // `UserSiteSelect`는 `sign` 엔드포인트라 토큰이 있어야 호출된다 → 로그인 중에
  // "토큰 있음 + siteSeq 없음" 중간 상태가 반드시 생긴다. 그 상태로 새로고침하면
  // 여기서 막지 않는 한 홈이 siteSeq 없이 조회를 날리고, 그 응답은 403이 아니라
  // 200 + 빈 목록이라(api-spec.md:211) **정상 응답인 빈 화면**으로 그려진다.
  //
  // 🔴 본사는 제외한다. 본사 계정은 사업장을 고르지 않는다(사용자 결정 2026-10-23, spec 043 US4 철회) —
  // 요구하면 본사 로그인이 그 자리에서 막힌다.
  if (!isAdmin && getSiteSeq() === null) {
    const target = `${paths.serviceLogin}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }

  if (isLoading) return null

  if (isError || !data) {
    const loginPath = isAdminArea(location.pathname) ? paths.adminLogin : paths.serviceLogin
    const target = `${loginPath}?redirect=${encodeURIComponent(location.pathname)}`
    return <Navigate to={target} replace />
  }

  return <Outlet />
}

export default AuthGuard
