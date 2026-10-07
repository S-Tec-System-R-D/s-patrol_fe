import { authHandlers } from './auth'
import { pointHandlers } from './points'

/**
 * MSW 핸들러 묶음 SSOT.
 *
 * 도메인 핸들러는 점진 이관 — 004에서는 `auth`만 가동했고, **도메인별 핸들러는 해당 화면
 * spec에서 추가**한다. `points`가 그 첫 사례다(`spec 022`).
 *
 * 🔴 화면을 실 API로 전환하는 spec은 **같은 Phase에서 핸들러를 함께** 넣어야 한다.
 * `npm run dev`(mock)와 `npm run capture`가 둘 다 MSW 위에서 돌기 때문에, 핸들러 없이
 * 전환하면 그 화면이 mock 모드에서 빈 화면이 되고 baseline 캡쳐가 깨진다.
 *
 * 기존 `features/{points,zone}/mock/*` 데이터는 핸들러에서 import해 **서버 스키마로
 * 변환해** 재사용한다(버리지 않는다).
 */
export const handlers = [...authHandlers, ...pointHandlers]
