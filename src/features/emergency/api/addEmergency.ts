import api from '@/lib/axios'
import type { EmergencyAssignRequest } from '../types/emergency'

/**
 * 비상연락 담당자 등록 (`spec 057` T1016) — `POST /api/v1/Emergency/W/sign/AddEmergency`.
 * 한 사람 · 한 요일. 🔴 같은 등록을 다시 보내도 200 · 중복 없음(멱등 — 실측).
 */

const ADD_EMERGENCY_PATH = '/api/v1/Emergency/W/sign/AddEmergency'

export const addEmergency = async (body: EmergencyAssignRequest): Promise<void> => {
  await api.post(ADD_EMERGENCY_PATH, body)
}
