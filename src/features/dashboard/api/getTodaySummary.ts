import api from '@/lib/axios'
import type { TodaySummary } from '../types'

/**
 * 오늘 숫자 (`spec 068` T1124).
 *
 * `GET /api/v1/DashBoard/W/sign/GetTodaySummary?siteSeq`
 */

const GET_TODAY_SUMMARY_PATH = '/api/v1/DashBoard/W/sign/GetTodaySummary'

export const fetchTodaySummary = async (siteSeq: number): Promise<TodaySummary> => {
  const res = await api.get<TodaySummary>(GET_TODAY_SUMMARY_PATH, { params: { siteSeq } })
  return res.data
}
