import api from '@/lib/axios'
import type { ApproveDeploymentRequest } from '../types/deployment'

/**
 * 배치 요청 승인 (`spec 039` T630) — 요청서 2번.
 *
 * 🔴 **가정 경로·메서드**다(API 미개발 — 미실측 가정). 기존 변경계 관례대로 성공은 `data: true` 로 보고
 * 반환값을 쓰지 않는다. 이미 처리된 요청은 400 + 래퍼(요청서에 명시).
 */

const APPROVE_DEPLOYMENT_REQUEST_PATH = '/api/v1/Deployment/W/sign/ApproveDeploymentRequest'

export const approveDeploymentRequest = async (body: ApproveDeploymentRequest): Promise<void> => {
  await api.post(APPROVE_DEPLOYMENT_REQUEST_PATH, body)
}
