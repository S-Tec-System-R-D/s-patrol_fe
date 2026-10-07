import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { PointListParams, PointRow } from '../types'

/**
 * 순찰지점 목록 조회.
 *
 * `GET /api/v1/Point/W/sign/GetPointList`
 *
 * 🔴 **`siteSeq` 가 required 다.** 권한 밖 사업장을 넣으면 403 이 아니라
 * **`HTTP 200` + 빈 목록**이 돌아와(`api-spec.md:211` B-9) "정상 응답인 빈 화면"이
 * 된다. 그래서 값은 반드시 `getSiteSeq()`(spec 021)가 준 것만 쓰고, `null` 이면
 * 호출 자체를 하지 않는다(훅의 `enabled: false`).
 *
 * 🔴 **`_raw` 를 쓰지 않는다** — 이 호출은 `code` 가 필요 없다. 인터셉터가 래퍼를
 * 벗겨 `data` 만 준다. `_raw` 의 확정 수요는 로그인·토큰 재발급 2곳뿐이고 번지면
 * A6 위반이다(`lib/axios.ts` 의 `_raw` 선언 주석 / 019 경계).
 *
 * `params` 의 `undefined` 값은 axios 가 쿼리스트링에서 빼므로, 필터 미적용은
 * `undefined` 로 표현한다("전체" 를 뜻하는 특수값을 서버로 보내지 않는다).
 */

const GET_POINT_LIST_PATH = '/api/v1/Point/W/sign/GetPointList'

export const fetchPointList = async (
  params: PointListParams
): Promise<PagedData<PointRow>> => {
  const res = await api.get<PagedData<PointRow>>(GET_POINT_LIST_PATH, { params })
  return res.data
}
