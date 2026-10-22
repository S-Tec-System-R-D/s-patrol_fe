import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { UserAssignmentHistoryParams, UserAssignmentHistoryRow } from '../types/deployment'

/**
 * 근무자별 배치 이력 (`spec 042` T704) — 사업장과 무관하게 **그 사람의 배치 전체**.
 * 없는 `userSeq` 도 200 빈 목록 · 반려 건은 안 나온다(실측).
 */

const GET_ASSIGNMENT_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentHistory'

export const fetchUserAssignmentHistory = async (
  params: UserAssignmentHistoryParams
): Promise<PagedData<UserAssignmentHistoryRow>> => {
  const res = await api.get<PagedData<UserAssignmentHistoryRow>>(GET_ASSIGNMENT_HISTORY_PATH, {
    params,
  })
  return res.data
}
