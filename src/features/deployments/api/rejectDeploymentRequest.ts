import api from '@/lib/axios'
import type { RejectDeploymentRequest } from '../types/deployment'

/**
 * 배치 요청 거부 (`spec 039` T630) — 요청서 3번.
 *
 * 🔴 **가정 경로·메서드**다(API 미개발 — 미실측 가정). 거부 사유는 필수이고 근무자 앱에만 보인다.
 */

const REJECT_DEPLOYMENT_REQUEST_PATH = '/api/v1/Deployment/W/sign/RejectDeploymentRequest'

export const rejectDeploymentRequest = async (body: RejectDeploymentRequest): Promise<void> => {
  await api.post(REJECT_DEPLOYMENT_REQUEST_PATH, body)
}
