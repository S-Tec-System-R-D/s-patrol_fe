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
 * ✅ **미사용 지점은 서버가 후보에서 제외한다**(실측 2026-10-13, `spec 028`). 응답에
 * `useYn` 이 없어 "섞여 있는지 알 수 없다" 고 적어 두었던 것은 **틀렸다** — 지점 하나를
 * `useYn=false` 로 바꾸자 후보가 14건 → **13건**이 되고 그 지점이 사라졌으며, 되돌리자
 * 복귀했다. 프론트에서 다시 거를 필요가 없다.
 *
 * ⚠️ 다만 **이미 편성된 지점은 미사용으로 꺼도 코스에 그대로 남는다**(후보에서만 빠진다).
 * 즉 "미사용 지점이 편성된 채 남아 있는 코스" 는 생길 수 있는데, `GetCourseDetail` 의
 * `points[].useYn` 이 **항상 `true`** 라 코스 상세에서는 구분할 수 없다(OQ-028-A).
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
