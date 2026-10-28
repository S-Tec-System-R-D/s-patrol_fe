import api from '@/lib/axios'
import type { EmergencyTreeNode } from '../types/emergency'

/** 비상연락 담당자 후보 트리 (`spec 057` T1016) — `GET /api/v1/Emergency/W/sign/GetEmergencyUserTree`. 파라미터 없음 */

const GET_EMERGENCY_USER_TREE_PATH = '/api/v1/Emergency/W/sign/GetEmergencyUserTree'

export const getEmergencyUserTree = async (): Promise<EmergencyTreeNode[]> => {
  const res = await api.get<EmergencyTreeNode[]>(GET_EMERGENCY_USER_TREE_PATH)
  return res.data
}
