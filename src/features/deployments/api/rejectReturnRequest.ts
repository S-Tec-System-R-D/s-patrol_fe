import api from '@/lib/axios'
import type { RejectReturnRequest } from '../types/deployment'

/** 복귀 요청 거부 (`spec 039` T659). 🔴 **가정 경로·메서드**(미실측 가정). 거부 사유 필수 */

const REJECT_RETURN_REQUEST_PATH = '/api/v1/Deployment/W/sign/RejectReturnRequest'

export const rejectReturnRequest = async (body: RejectReturnRequest): Promise<void> => {
  await api.post(REJECT_RETURN_REQUEST_PATH, body)
}
