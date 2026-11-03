import api from '@/lib/axios'
import type { DashboardCourse } from '../types'

/**
 * 진행 중 회차 (`spec 068` T1124).
 *
 * `GET /api/v1/DashBoard/W/sign/GetDashboardCourseList?siteSeq` — 배열(페이징 없음).
 */

const GET_DASHBOARD_COURSE_LIST_PATH = '/api/v1/DashBoard/W/sign/GetDashboardCourseList'

export const fetchDashboardCourseList = async (siteSeq: number): Promise<DashboardCourse[]> => {
  const res = await api.get<DashboardCourse[]>(GET_DASHBOARD_COURSE_LIST_PATH, { params: { siteSeq } })
  return res.data
}
