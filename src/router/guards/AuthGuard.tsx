import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/features/auth/hooks/useMe'
import { getAccessToken } from '@/lib/auth/tokens'
import { getSiteSeq } from '@/lib/auth/site'
import { paths, isAdminArea } from '@/router/paths'

/**
 * 보호 라우트 진입 가드.
 * - 토큰 없음 → 영역별 로그인 화면으로 Navigate(`?redirect=` 보존)
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

  // 🔴 사업장 미선택 차단(spec 021 §3 규칙 6).
  //
  // `UserSiteSelect`는 `sign` 엔드포인트라 토큰이 있어야 호출된다 → 로그인 중에
  // "토큰 있음 + siteSeq 없음" 중간 상태가 반드시 생긴다. 그 상태로 새로고침하면
  // 여기서 막지 않는 한 홈이 siteSeq 없이 조회를 날리고, 그 응답은 403이 아니라
  // 200 + 빈 목록이라(api-spec.md:211) **정상 응답인 빈 화면**으로 그려진다.
  //
  // 🔴 본사는 제외한다. 본사는 아직 선택 단계가 없어(siteSeq 소비처 0개, Phase 5)
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
