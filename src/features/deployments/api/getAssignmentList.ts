import api from '@/lib/axios'
import type { AssignmentRequestRow } from '../types/deployment'

/**
 * 대기 중 배치 요청 (`spec 042` T703) — **목적지** 사업장(= `siteSeq`)으로 들어온 것.
 *
 * 🔴 **배열이다, 페이징 없음**(실측) — 대기 건만 오는 목록이라 화면이 잘라 보인다.
 */

const GET_ASSIGNMENT_LIST_PATH = '/api/v1/Assignment/W/sign/GetAssignmentList'

export const fetchAssignmentList = async (siteSeq: number): Promise<AssignmentRequestRow[]> => {
  const res = await api.get<AssignmentRequestRow[]>(GET_ASSIGNMENT_LIST_PATH, {
    params: { siteSeq },
  })
  return res.data
}
