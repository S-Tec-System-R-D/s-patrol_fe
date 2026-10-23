import api from '@/lib/axios'
import type { GroupNode } from '@/features/auth/types/site'

/**
 * 본사 계정의 관리그룹 + 사업장 트리 조회 (`spec 043` T736).
 *
 * `GET /api/v1/Login/W/sign/AdminSiteSelect` — **파라미터 없다.** 서버가 토큰의 사용자 기준으로 트리를 정한다.
 *
 * 🔴 **두 곳이 같이 쓴다** — 본사 로그인의 사업장 선택(평탄화해서 선택지로)과 본사 관리그룹 트리(그대로).
 * 관리그룹 전용 조회 `GetGroupList` 는 500 이라(B-1) 이것이 트리의 유일한 출처다.
 *
 * 🔴 현장 계정으로 부르면 **403 + 빈 body** 다(`UserSiteSelect` 와 상호 배타 — `api-spec.md` §5-1).
 * 🔴 `sign` 엔드포인트라 **토큰 저장이 이 호출보다 먼저**여야 한다(`userSiteSelect.ts` 와 같다).
 */

const ADMIN_SITE_SELECT_PATH = '/api/v1/Login/W/sign/AdminSiteSelect'

export const fetchAdminSiteSelect = async (): Promise<GroupNode> => {
  const res = await api.get<GroupNode>(ADMIN_SITE_SELECT_PATH)
  return res.data
}
