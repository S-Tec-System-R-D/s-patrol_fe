import api from '@/lib/axios'
import type { UpdateGroupRequest } from '../types/group'

/**
 * 관리그룹 수정 (`spec 043` T737) — **`PUT` JSON**, 성공 `data: true`(실측).
 *
 * 🔴🔴 `userSeq` 는 **통째로 교체**다 — 이름만 바꿀 때도 현재 할당을 실어야 한다(B-50).
 * 직접 부르지 말고 `useRenameGroup` 을 쓴다(할당을 먼저 읽는다).
 */

const UPDATE_GROUP_PATH = '/api/v1/Group/W/sign/UpdateGroup'

export const updateGroup = async (body: UpdateGroupRequest): Promise<void> => {
  await api.put(UPDATE_GROUP_PATH, body)
}
