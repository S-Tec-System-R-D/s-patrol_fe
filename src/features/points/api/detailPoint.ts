import api from '@/lib/axios'
import type { PointDetail } from '../types'

/**
 * 순찰지점 상세 조회.
 *
 * `GET /api/v1/Point/W/sign/DetailPoint?pointSeq=`
 *
 * 🔴 **응답의 이름 필드는 `name` 이다** — 목록(`PointRow`)은 `pointName` 이고 둘을
 * 맞추지 않는다(서버 내부 불일치 B-4 / `spec 022` §3 규칙 5). 목록 행을 그대로
 * 상세에 넘기지 않고 `pointSeq` 로 **따로 조회**하는 구조이므로 둘이 한 자리에서
 * 만나지 않는다.
 *
 * `siteSeq` 를 받지 않는다 — 지점 식별자만으로 조회된다(swagger 실측).
 */

const DETAIL_POINT_PATH = '/api/v1/Point/W/sign/DetailPoint'

export const fetchPointDetail = async (pointSeq: number): Promise<PointDetail> => {
  const res = await api.get<PointDetail>(DETAIL_POINT_PATH, { params: { pointSeq } })
  return res.data
}
