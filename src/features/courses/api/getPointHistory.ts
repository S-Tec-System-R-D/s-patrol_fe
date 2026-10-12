import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { PointHistoryParams, PointHistoryRow } from '../types'

/**
 * 지점 순찰이력 조회.
 *
 * `GET /api/v1/History/W/sign/GetPointHistory`
 *
 * B단은 **`totalCount` 만** 쓴다 — "미인증 n건" KPI 다(`status=3`). 행 자체는 C단
 * (이상 이력)에서 쓴다. 그래서 `pageSize` 를 1 로 두고 건수만 받는다.
 *
 * ✅ 코스이력과 달리 **`status` 필터가 원래 있다**(코스이력은 `eventType` 이 그 역할).
 * 받는 것: `siteSeq`(필수) · `fromDt` · `toDt` · `courseSeq` · `pointSeq` · `authMethod` ·
 * `userSeq` · `status` · `courseName` · `userName` · 페이징.
 *
 * ⚠️ `status` 는 **지점 사전**이다(`0` 대기중 / `1` 진행중 / **`2` 순찰제외** / `3` 미완료 /
 * `4` 완료). 코스 사전(`0·1·2`)과 **값이 겹치는데 뜻이 다르다** — 섞으면 "미완료" 를
 * "순찰제외" 로 읽는다(`api-spec.md` §4).
 */

const GET_POINT_HISTORY_PATH = '/api/v1/History/W/sign/GetPointHistory'

export const fetchPointHistory = async (
  params: PointHistoryParams
): Promise<PagedData<PointHistoryRow>> => {
  const res = await api.get<PagedData<PointHistoryRow>>(GET_POINT_HISTORY_PATH, { params })
  return res.data
}
