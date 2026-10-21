import api from '@/lib/axios'
import type { DeploymentSummary } from '../types/deployment'

/**
 * 배치 현황 요약 (`spec 039` T630) — 요청서 7번.
 *
 * 🔴 **가정 경로**다(API 미개발). 백엔드 구현 후 이 상수만 고친다.
 */

const GET_DEPLOYMENT_SUMMARY_PATH = '/api/v1/Deployment/W/sign/GetDeploymentSummary'

export const fetchDeploymentSummary = async (siteSeq: number): Promise<DeploymentSummary> => {
  const res = await api.get<DeploymentSummary>(GET_DEPLOYMENT_SUMMARY_PATH, { params: { siteSeq } })
  return res.data
}
