/**
 * 시뮬레이터 설정 (`spec 082`).
 *
 * 값을 **호출할 때** 읽는다(모듈 상수로 굳히지 않는다) — 테스트가 `vi.stubEnv` 로 바꿀 수 있어야 한다.
 * 계정 3개는 `.env.real.local`(git 제외)에만 있다.
 */
export interface SimConfig {
  /** 앱(모바일) API 서버 주소 — 프록시를 타지 않고 직접 호출한다 */
  appApiBaseUrl: string
  /** 웹 API 주소 — 비어 있으면 상대 경로(dev 프록시) */
  webApiBaseUrl: string
  adminId: string
  adminPw: string
  /** 시뮬 대상 근무자 · 현장관리자의 공통 비밀번호 */
  workerPw: string
  mockMode: boolean
}

export const getSimConfig = (): SimConfig => ({
  appApiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL ?? '',
  webApiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  adminId: import.meta.env.VITE_SIM_ADMIN_ID ?? '',
  adminPw: import.meta.env.VITE_SIM_ADMIN_PW ?? '',
  workerPw: import.meta.env.VITE_SIM_WORKER_PW ?? '',
  mockMode: import.meta.env.VITE_USE_MSW === 'true',
})

/** 실행을 막는 사유. 하나라도 있으면 화면 대신 안내를 보인다 */
export type SimBlocker = 'mock' | 'no-app-url' | 'no-account' | 'localhost'

/**
 * @param hostname 페이지를 연 주소의 호스트. 앱 서버가 **IP 로 연 출처만** 허용한다(CORS) —
 *   `localhost` 로 열면 앱 API 가 전부 차단된다
 */
export const getSimBlockers = (config: SimConfig, hostname: string): SimBlocker[] => {
  const blockers: SimBlocker[] = []
  if (config.mockMode) blockers.push('mock')
  if (!config.appApiBaseUrl) blockers.push('no-app-url')
  if (!config.adminId || !config.adminPw || !config.workerPw) blockers.push('no-account')
  if (hostname === 'localhost' || hostname === '127.0.0.1') blockers.push('localhost')
  return blockers
}
