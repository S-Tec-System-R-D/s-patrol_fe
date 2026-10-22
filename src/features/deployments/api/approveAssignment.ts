import api from '@/lib/axios'
import type { AssignmentApproveRequest } from '../types/deployment'

/**
 * 배치 요청 승인·반려 (`spec 042` T703) — **`PUT` JSON**, 성공 `data: true`(실측).
 *
 * 🔴 승인과 반려가 **같은 API** 다(`approved` 로 갈린다). 반려 사유 필드는 없다.
 * 🔴 `approved` 를 빼면 서버가 반려로 처리한다(B-48) — 타입이 필수로 막는다.
 */

const ASSIGNMENT_APPROVE_PATH = '/api/v1/Assignment/W/sign/AssignmentApprove'

export const approveAssignment = async (body: AssignmentApproveRequest): Promise<void> => {
  await api.put(ASSIGNMENT_APPROVE_PATH, body)
}
