import api from '@/lib/axios'
import type { EmergencyAssignRequest } from '../types/emergency'

/**
 * 비상연락 담당자 해제 (`spec 057` T1016) — `DELETE /api/v1/Emergency/W/sign/DeleteEmergency?siteSeq&userSeq&day`.
 * 등록되지 않은 사람은 400 "등록된 비상연락망 담당자가 아닙니다."(실측).
 */

const DELETE_EMERGENCY_PATH = '/api/v1/Emergency/W/sign/DeleteEmergency'

export const deleteEmergency = async (params: EmergencyAssignRequest): Promise<void> => {
  await api.delete(DELETE_EMERGENCY_PATH, { params })
}
