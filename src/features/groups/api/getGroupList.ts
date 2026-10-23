import api from '@/lib/axios'
import type { GroupListNode } from '../types/group'

/**
 * 관리그룹 + 사업장 목록 트리 조회 (`spec 044` T779).
 *
 * `GET /api/v1/Group/W/sign/GetGroupList` — **파라미터 없다.** 2026-10-23 까지 500 이었다(B-1, 같은 날 수정).
 *
 * 🔴 `AdminSiteSelect` 와 같은 이중 재귀 트리에 주소 · 연락처 · 근무자 수 · 하위 수가 붙는다 — 사업장 목록의 출처다.
 * 좌측 관리그룹 패널은 043 그대로 `AdminSiteSelect` 를 쓴다(사용자 결정 2026-10-23). 현장 계정은 403 + 빈 body.
 */

const GET_GROUP_LIST_PATH = '/api/v1/Group/W/sign/GetGroupList'

export const getGroupList = async (): Promise<GroupListNode> => {
  const res = await api.get<GroupListNode>(GET_GROUP_LIST_PATH)
  return res.data
}
