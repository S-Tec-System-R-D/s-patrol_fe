import api from '@/lib/axios'
import type { AssignmentRequestRow } from '../types/deployment'

/**
 * 대기 중 복귀 요청 (`spec 042` T703) — **원소속** 사업장(= `siteSeq`)으로 들어온 것.
 *
 * 🔴 배치 요청과 **같은 행**이고 `from → to` 는 **원래 배치 방향**이다(실측) — 복귀 경로는 화면이 뒤집는다.
 * 배열, 페이징 없음.
 */

const GET_ASSIGNMENT_RETURN_LIST_PATH = '/api/v1/Assignment/W/sign/GetAssignmentReturnList'

export const fetchAssignmentReturnList = async (
  siteSeq: number
): Promise<AssignmentRequestRow[]> => {
  const res = await api.get<AssignmentRequestRow[]>(GET_ASSIGNMENT_RETURN_LIST_PATH, {
    params: { siteSeq },
  })
  return res.data
}
