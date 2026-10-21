import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { DeploymentRequestListParams, ReturnRequestRow } from '../types/deployment'

/**
 * 대기 중 복귀 요청 목록 (`spec 039` T659) — 원소속 사업장(= `siteSeq`)으로 들어온 것.
 *
 * 🔴 **가정 경로**다(API 미개발). 파라미터는 배치 요청 목록과 같다고 가정한다(사업장 · 페이징).
 */

const GET_RETURN_REQUEST_LIST_PATH = '/api/v1/Deployment/W/sign/GetReturnRequestList'

export const fetchReturnRequestList = async (
  params: DeploymentRequestListParams
): Promise<PagedData<ReturnRequestRow>> => {
  const res = await api.get<PagedData<ReturnRequestRow>>(GET_RETURN_REQUEST_LIST_PATH, { params })
  return res.data
}
