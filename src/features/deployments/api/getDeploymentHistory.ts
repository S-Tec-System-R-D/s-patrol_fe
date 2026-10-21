import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { DeploymentHistoryParams, DeploymentHistoryRow } from '../types/deployment'

/**
 * 전출·전입 이력 (`spec 039` T630) — 요청서 4·5번.
 *
 * 🔴 **가정 경로**다(API 미개발). 엔드포인트 1개 + `direction` 으로 가정했다(OQ-039-B) — 백엔드가
 * 둘로 나누면 이 파일만 두 함수가 된다.
 */

const GET_DEPLOYMENT_HISTORY_PATH = '/api/v1/Deployment/W/sign/GetDeploymentHistory'

export const fetchDeploymentHistory = async (
  params: DeploymentHistoryParams
): Promise<PagedData<DeploymentHistoryRow>> => {
  const res = await api.get<PagedData<DeploymentHistoryRow>>(GET_DEPLOYMENT_HISTORY_PATH, {
    params,
  })
  return res.data
}
