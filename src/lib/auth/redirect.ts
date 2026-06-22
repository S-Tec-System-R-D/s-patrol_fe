/**
 * 영역별 로그인 리다이렉트 헬퍼.
 * - `/admin/` 경로면 `/admin/login`, 그 외는 `/login`.
 * - 현재 경로를 `?redirect=`에 담아 로그인 화면이 복귀에 활용한다(Phase 3 로그인 화면 책임).
 * - axios 인터셉터(라우터 외부 컨텍스트)에서 호출하므로 `window.location.assign`을 쓴다.
 *
 * 영역 prefix(`/admin/`)는 004 라우트 상수 SSOT 도입 시 교체한다(spec.md Open Q).
 */
export const redirectToLogin = (currentPath: string): void => {
  const isAdmin = currentPath.startsWith('/admin')
  const loginPath = isAdmin ? '/admin/login' : '/login'
  const target = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`
  window.location.assign(target)
}
