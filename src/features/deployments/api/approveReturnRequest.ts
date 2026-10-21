import api from '@/lib/axios'
import type { ApproveReturnRequest } from '../types/deployment'

/**
 * 복귀 요청 승인 (`spec 039` T659). 🔴 **가정 경로·메서드**(미실측 가정) — 성공은 `data: true`.
 * 승인하면 그 배치 이력이 복귀일로 닫힌다.
 */

const APPROVE_RETURN_REQUEST_PATH = '/api/v1/Deployment/W/sign/ApproveReturnRequest'

export const approveReturnRequest = async (body: ApproveReturnRequest): Promise<void> => {
  await api.post(APPROVE_RETURN_REQUEST_PATH, body)
}
