import { isAdminArea, paths } from '@/router/paths'

/**
 * 영역별 로그인 리다이렉트 헬퍼.
 * - `/admin/` 경로면 `/admin/login`, 그 외는 `/login`.
 * - 현재 경로를 `?redirect=`에 담아 로그인 화면이 복귀에 활용한다(Phase 3 로그인 화면 책임).
 * - axios 인터셉터(라우터 외부 컨텍스트)에서 호출하므로 `window.location.assign`을 쓴다.
 *
 * 영역/경로 prefix는 004에서 `paths` SSOT로 통합됨(`isAdminArea` + `paths.adminLogin` / `paths.serviceLogin`).
 */
export const redirectToLogin = (currentPath: string): void => {
  const loginPath = isAdminArea(currentPath) ? paths.adminLogin : paths.serviceLogin
  const target = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`
  window.location.assign(target)
}
