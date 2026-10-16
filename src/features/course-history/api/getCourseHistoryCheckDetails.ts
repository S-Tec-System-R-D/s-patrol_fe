import api from '@/lib/axios'
import type { CheckDetailRow } from '../types'

/**
 * 코스 순찰이력의 **지점 인증 내역** (`spec 036` T496).
 *
 * `GET /api/v1/History/W/sign/GetCourseHistoryCheckDetails?historySeq=`
 *
 * 🔴 **`PagedData` 가 아니라 배열 직접이다** — 페이징이 없다(`api-spec.md` §5-1 17번,
 * `GetClassificationPoint` 와 같은 모양). 한 회차의 지점 수만큼이라 상한이 코스 편성
 * 크기로 묶여 있다.
 *
 * 🔴 **이 응답이 036 상세의 중심이다.** 인증 내역 표 · 지도의 인증 핀 · KPI 3종(지점 인증
 * 수 · 특이사항 건수 · 구간 간격) · 메모가 전부 여기서 나온다. 요청 1회로 네 자리를 채운다.
 *
 * ⚠️ **`status` 는 지점 사전**(`0~4`)이다. 같은 응답을 쓰는 코스 쪽 사전(`0~2`)과 값이
 * 겹치는데 뜻이 다르다 — 뱃지는 `lib/historyBadge.ts` 의 `pointCheckBadge` 를 쓴다.
 * ⚠️ **좌표는 인증 시점 위치**라 미인증 행은 `null` 이다. 지점 등록 좌표는
 * `GetCourseDetail.points[]` 에 있다(B-32 해소) — 지도는 둘을 합쳐 그린다.
 */

const GET_CHECK_DETAILS_PATH = '/api/v1/History/W/sign/GetCourseHistoryCheckDetails'

export const fetchCourseHistoryCheckDetails = async (
  historySeq: number
): Promise<CheckDetailRow[]> => {
  const res = await api.get<CheckDetailRow[]>(GET_CHECK_DETAILS_PATH, {
    params: { historySeq },
  })
  return res.data
}
