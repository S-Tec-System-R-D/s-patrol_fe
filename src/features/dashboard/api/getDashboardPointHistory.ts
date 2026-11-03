import type { PointHistoryRow } from '@/features/course-history/types'
import api from '@/lib/axios'
import type { PagedData } from '@/types/api'

/**
 * 최근 미완료 · 시간초과 (`spec 068` T1124).
 *
 * `GET /api/v1/DashBoard/W/sign/GetDashboardPointHistory`
 *
 * 응답은 `GetPointHistory` 와 행 단위까지 같다 + **`overTimeYn` 필터**(지점 단위). 🔴 기존
 * `GetPointHistory` 는 `overTimeYn` 을 무시한다 — 그래서 이 엔드포인트를 따로 둔다(실측 2026-11-03).
 * `status` 와 함께 주면 AND 라, 화면은 `status=3` · `overTimeYn=true` 를 **따로 2번** 부른다.
 */

const GET_DASHBOARD_POINT_HISTORY_PATH = '/api/v1/DashBoard/W/sign/GetDashboardPointHistory'

export interface DashboardPointHistoryParams {
  siteSeq: number
  /** 지점 사전 — `3` 미완료 */
  status?: number
  overTimeYn?: boolean
  pageNumber: number
  pageSize: number
}

export const fetchDashboardPointHistory = async (
  params: DashboardPointHistoryParams
): Promise<PagedData<PointHistoryRow>> => {
  const res = await api.get<PagedData<PointHistoryRow>>(GET_DASHBOARD_POINT_HISTORY_PATH, { params })
  return res.data
}
