import api from '@/lib/axios'
import type { GroupAdminRow } from '../types/group'

/**
 * 그룹별 관리자 할당 조회 (`spec 043` T737).
 *
 * `GET /api/v1/Group/W/sign/GetGroupAdminList?groupSeq=` — 본사 관리자 전원 + 그 그룹 할당 여부(`isInclude`).
 *
 * 043 에서는 **이름 변경 직전 현재 할당을 읽는 용도**로만 쓴다(B-50). 할당 화면은 045.
 */

const GET_GROUP_ADMIN_LIST_PATH = '/api/v1/Group/W/sign/GetGroupAdminList'

export const getGroupAdminList = async (groupSeq: number): Promise<GroupAdminRow[]> => {
  const res = await api.get<GroupAdminRow[]>(GET_GROUP_ADMIN_LIST_PATH, { params: { groupSeq } })
  return res.data
}
