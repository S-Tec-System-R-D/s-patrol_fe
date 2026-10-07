import api from '@/lib/axios'
import type { UserSiteSelectData } from '@/features/auth/types/site'

/**
 * 현장 계정의 접근 가능 사업장 조회.
 *
 * `GET /api/v1/Login/W/sign/UserSiteSelect` — **파라미터 없다.** 서버가 토큰의 사용자
 * 기준으로 목록을 결정한다(`api-spec.md` §2-2).
 *
 * 🔴 **`sign` 엔드포인트라 `Authorization` 헤더가 필요하다.** 헤더는 요청 인터셉터가
 * `getAccessToken()`에서 붙이므로, **토큰 저장이 이 호출보다 먼저여야 한다**
 * (`spec 021` §3 규칙 5). 그래서 "토큰 있음 + `siteSeq` 없음" 중간 상태가 생기고,
 * `AuthGuard`가 그 상태를 막는다.
 *
 * 🔴 **`_raw`를 쓰지 않는다.** 이 호출은 `code`가 필요 없다 — 인터셉터가 래퍼를 벗겨
 * `data`만 준다. `_raw`의 확정 수요는 로그인·토큰 재발급 2곳뿐이고 번지면 A6 위반이다
 * (`lib/axios.ts`의 `_raw` 선언 주석).
 *
 * 본사(`AdminSiteSelect`)는 **상호 배타**라 현장 계정으로 호출하면 403이고, 그 반대도
 * 403이다(`api-spec.md:286·287`). 본사 선택은 `spec 021` 범위 외(Phase 5).
 */

const USER_SITE_SELECT_PATH = '/api/v1/Login/W/sign/UserSiteSelect'

export const fetchUserSiteSelect = async (): Promise<UserSiteSelectData> => {
  const res = await api.get<UserSiteSelectData>(USER_SITE_SELECT_PATH)
  return res.data
}
