import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type {
  AssignmentHistoryParams,
  AssignmentInHistoryRow,
  AssignmentOutHistoryRow,
} from '../types/deployment'

/**
 * 전입·전출 이력 (`spec 042` T703) — 🔴 **엔드포인트가 둘이다**(실측 — 039 의 `direction` 가정 폐기).
 * 행 모양도 다르다: 전입은 `fromSiteName`, 전출은 `toSiteName` 만 온다.
 */

const GET_ASSIGNMENT_IN_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentInHistory'
const GET_ASSIGNMENT_OUT_HISTORY_PATH = '/api/v1/Assignment/W/sign/GetAssignmentOutHistory'

export const fetchAssignmentInHistory = async (
  params: AssignmentHistoryParams
): Promise<PagedData<AssignmentInHistoryRow>> => {
  const res = await api.get<PagedData<AssignmentInHistoryRow>>(GET_ASSIGNMENT_IN_HISTORY_PATH, {
    params,
  })
  return res.data
}

export const fetchAssignmentOutHistory = async (
  params: AssignmentHistoryParams
): Promise<PagedData<AssignmentOutHistoryRow>> => {
  const res = await api.get<PagedData<AssignmentOutHistoryRow>>(GET_ASSIGNMENT_OUT_HISTORY_PATH, {
    params,
  })
  return res.data
}
