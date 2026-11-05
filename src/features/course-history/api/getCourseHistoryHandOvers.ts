import api from '@/lib/axios'
import type { HandOverRow } from '../types'

/**
 * 회차의 교대 기록 — 누가 누구에게 어느 지점 뒤 넘겼는지(`spec 070`).
 *
 * `GET /api/v1/History/W/sign/GetCourseHistoryHandOvers?historySeq=` — 배열 직접(페이징 없음).
 * 🟡 원래 순찰자에게 되돌린 교대는 기록이 사라진다(B-68).
 */

const GET_HAND_OVERS_PATH = '/api/v1/History/W/sign/GetCourseHistoryHandOvers'

export const fetchCourseHistoryHandOvers = async (historySeq: number): Promise<HandOverRow[]> => {
  const res = await api.get<HandOverRow[]>(GET_HAND_OVERS_PATH, { params: { historySeq } })
  return res.data
}
