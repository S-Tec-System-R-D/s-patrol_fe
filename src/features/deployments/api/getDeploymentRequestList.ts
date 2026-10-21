import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { DeploymentRequestListParams, DeploymentRequestRow } from '../types/deployment'

/**
 * 대기 중 배치 요청 목록 (`spec 039` T630) — 요청서 1번.
 *
 * 🔴 **가정 경로**다(API 미개발). 백엔드 구현 후 이 상수만 고친다.
 */

const GET_DEPLOYMENT_REQUEST_LIST_PATH = '/api/v1/Deployment/W/sign/GetDeploymentRequestList'

export const fetchDeploymentRequestList = async (
  params: DeploymentRequestListParams
): Promise<PagedData<DeploymentRequestRow>> => {
  const res = await api.get<PagedData<DeploymentRequestRow>>(GET_DEPLOYMENT_REQUEST_LIST_PATH, {
    params,
  })
  return res.data
}
