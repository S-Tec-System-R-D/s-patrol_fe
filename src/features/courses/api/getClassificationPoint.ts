import api from '@/lib/axios'
import type { ClassificationPoint } from '../types'

/**
 * 코스 편성용 지점 후보 목록.
 *
 * `GET /api/v1/Course/W/sign/GetClassificationPoint?siteSeq=`
 *
 * 🔴🔴 **응답이 `PagedData` 가 아니다 — 배열이 직접 온다**(실측 §5-2 14번). 이 도메인의
 * 다른 5종과 **언래핑 모양이 다르다.** `res.data.items` 로 읽으면 `undefined` 가 되고
 * 화면은 "후보 0건" 으로 조용히 비어 보인다.
 *
 * 🔴 **페이징이 없다.** 사업장의 지점이 **전량** 내려오므로 후보가 많으면 클라이언트에서
 * 걸러야 한다(OQ-023-C — 편성 모달에 검색 입력을 둔다).
 *
 * ⚠️ 응답에 `useYn` 이 없어 **미사용 지점이 섞여 있는지 알 수 없다.** 미사용 지점을
 * 코스에 넣을 수 있는지도 미확인 — 추측으로 걸러내지 않는다(A1).
 */

const GET_CLASSIFICATION_POINT_PATH = '/api/v1/Course/W/sign/GetClassificationPoint'

export const fetchClassificationPoints = async (
  siteSeq: number
): Promise<ClassificationPoint[]> => {
  const res = await api.get<ClassificationPoint[]>(GET_CLASSIFICATION_POINT_PATH, {
    params: { siteSeq },
  })
  return res.data
}
