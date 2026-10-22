import api from '@/lib/axios'
import type { AssignmentApproveRequest } from '../types/deployment'

/**
 * 복귀 요청 승인·반려 (`spec 042` T703) — 배치와 **같은 바디**, 경로만 다르다(실측).
 * 반려하면 배치는 그대로(배치중)이고 근무자는 다시 복귀 요청할 수 있다.
 */

const ASSIGNMENT_RETURN_APPROVE_PATH = '/api/v1/Assignment/W/sign/AssignmentReturnApprove'

export const approveAssignmentReturn = async (body: AssignmentApproveRequest): Promise<void> => {
  await api.put(ASSIGNMENT_RETURN_APPROVE_PATH, body)
}
