import { useQuery } from '@tanstack/react-query'

import { fetchPointDetail } from '../api/detailPoint'
import { pointKeys } from '../queryKeys'

/**
 * 순찰지점 상세 조회.
 *
 * 🔴 **목록 행을 그대로 쓰지 않고 `pointSeq`로 따로 조회한다**(`spec 022` §3 규칙 4).
 * 서버는 목록(`PointRow`)과 상세(`PointDetail`)의 필드가 다르고(이름부터 `pointName` ↔
 * `name`), 상세에만 있는 값(`qrCode`·`courseList`·`gps`)이 화면에 필요하다.
 *
 * 선택이 없으면(`null`) 조회하지 않는다.
 */

const NO_POINT = -1

export const usePointDetail = (pointSeq: number | null) =>
  useQuery({
    queryKey: pointKeys.detail(pointSeq ?? NO_POINT),
    queryFn: () => fetchPointDetail(pointSeq as number),
    enabled: pointSeq !== null,
  })
