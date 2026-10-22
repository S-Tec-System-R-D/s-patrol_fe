import api from '@/lib/axios'
import type { AssignmentCount } from '../types/deployment'

/** 배치 현황 요약 (`spec 042` T703) — KPI 3종 + 사이드바 대기 뱃지 */

const GET_ASSIGNMENT_COUNT_PATH = '/api/v1/Assignment/W/sign/GetAssignmentCount'

export const fetchAssignmentCount = async (siteSeq: number): Promise<AssignmentCount> => {
  const res = await api.get<AssignmentCount>(GET_ASSIGNMENT_COUNT_PATH, { params: { siteSeq } })
  return res.data
}
