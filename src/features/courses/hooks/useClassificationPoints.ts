import { useQuery } from '@tanstack/react-query'

import { fetchClassificationPoints } from '../api/getClassificationPoint'
import { courseKeys } from '../queryKeys'

/**
 * 코스 편성용 지점 후보 목록.
 *
 * 🔴 **`siteSeq` 가 없으면 조회하지 않는다**(목록 훅과 같은 이유 — B-9).
 *
 * 🔴 **응답이 배열이다**(`PagedData` 아님). 페이징이 없어 사업장의 지점이 전량
 * 내려오므로, 편성 모달에서 **클라이언트 검색**으로 좁힌다(OQ-023-C).
 *
 * ⚠️ `enabled` 를 인자로 받는다 — 편성 모달이 **열릴 때만** 조회하려는 용도다. 상세
 * 페이지를 열 때마다 전량을 받아 올 이유가 없다.
 */

const NO_SITE = -1

export const useClassificationPoints = (siteSeq: number | null, enabled = true) =>
  useQuery({
    queryKey: courseKeys.classificationPoints(siteSeq ?? NO_SITE),
    queryFn: () => fetchClassificationPoints(siteSeq as number),
    enabled: enabled && siteSeq !== null,
  })
