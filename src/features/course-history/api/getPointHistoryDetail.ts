import api from '@/lib/axios'
import type { PointHistoryDetail } from '../types'

/**
 * 지점 인증 1건 상세 조회 (`spec 037` T533).
 *
 * `GET /api/v1/History/W/sign/GetPointHistoryDetail?detailSeq=`
 *
 * 🔴 **키가 지점이 아니라 인증 1건(`detailSeq`)이다.** 같은 지점이 하루에 여러 번 찍히고
 * 회차마다 결과가 다르다 — `pointSeq` 로 열면 "어느 인증인지" 가 사라진다.
 *
 * 🔴 **메모·사진이 여기에만 있다.** 목록은 `hasMemo: boolean` 뿐이므로 목록에 내용을
 * 붙이려면 행마다 이 요청을 해야 한다(N+1) — 그래서 목록은 **아이콘만** 두고 내용은
 * 상세로 넘긴다(`spec 023` C단·036 이 코스에서 한 것과 같은 판단).
 *
 * ⚠️ **응답이 목록과 어긋난다**(B-4·B-5): `overtimeYn`(소문자 t) · `authMethodName` null 이
 * **`'Unknown'`** · `pauseTime: number`. 어댑터를 두지 않고 호출부가 흡수한다
 * (`PointHistoryDetail` 머리말).
 */

const GET_POINT_HISTORY_DETAIL_PATH = '/api/v1/History/W/sign/GetPointHistoryDetail'

export const fetchPointHistoryDetail = async (detailSeq: number): Promise<PointHistoryDetail> => {
  const res = await api.get<PointHistoryDetail>(GET_POINT_HISTORY_DETAIL_PATH, {
    params: { detailSeq },
  })
  return res.data
}
