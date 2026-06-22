import { authHandlers } from './auth'

/**
 * MSW 핸들러 묶음 SSOT.
 * 도메인 핸들러는 점진 이관 — 본 spec(004)에서는 `auth`만 가동.
 * 도메인별 핸들러는 해당 화면 spec에서 추가하며,
 * 기존 `features/{points,zone}/mock/*` 데이터는 핸들러에서 import해 재사용한다.
 */
export const handlers = [...authHandlers]
