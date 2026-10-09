import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { PointHistoryParams, PointHistoryRow } from '../types'

/**
 * 지점 순찰이력 조회.
 *
 * `GET /api/v1/History/W/sign/GetPointHistory`
 *
 * 🔴 **`Point/*` 가 아니라 `History/*` 다.** 지점 상세에서 쓰지만 소유 도메인은 이력이다.
 * `spec 024`(지점 순찰이력 화면)가 같은 엔드포인트를 더 많은 필터와 함께 쓴다 — 그때
 * 이 파일을 `features/patrol-points` 로 옮길지 판단한다(지금 옮기면 소비처가 1곳뿐이다).
 *
 * 응답 타입은 실측(`api-spec.md` §5-2 19번)이고 `PagedData` 래퍼다.
 */

const GET_POINT_HISTORY_PATH = '/api/v1/History/W/sign/GetPointHistory'

export const fetchPointHistory = async (
  params: PointHistoryParams
): Promise<PagedData<PointHistoryRow>> => {
  const res = await api.get<PagedData<PointHistoryRow>>(GET_POINT_HISTORY_PATH, { params })
  return res.data
}
