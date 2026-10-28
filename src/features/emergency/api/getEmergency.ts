import api from '@/lib/axios'
import type { EmergencyDayEntry } from '../types/emergency'

/** 요일별 비상연락 담당자 (`spec 057` T1016) — `GET /api/v1/Emergency/W/sign/GetEmergency?siteSeq=`. 항상 7요일 */

const GET_EMERGENCY_PATH = '/api/v1/Emergency/W/sign/GetEmergency'

export const getEmergency = async (siteSeq: number): Promise<EmergencyDayEntry[]> => {
  const res = await api.get<EmergencyDayEntry[]>(GET_EMERGENCY_PATH, { params: { siteSeq } })
  return res.data
}
