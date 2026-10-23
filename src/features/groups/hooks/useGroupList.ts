import { useQuery } from '@tanstack/react-query'

import { getGroupList } from '../api/getGroupList'
import { groupKeys } from '../queryKeys'

/** 관리그룹 + 사업장 목록 트리 (`spec 044` T783) — 사업장 목록 · 상세의 소속 그룹 출처 */
export const useGroupList = () =>
  useQuery({
    queryKey: groupKeys.list,
    queryFn: getGroupList,
  })
