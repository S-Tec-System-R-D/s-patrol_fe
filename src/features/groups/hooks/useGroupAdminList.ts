import { useQuery } from '@tanstack/react-query'

import { getGroupAdminList } from '../api/getGroupAdminList'
import { groupKeys } from '../queryKeys'

/**
 * 그룹별 관리자 할당 (`spec 044` T800) — 본사 관리자 전원 + `isInclude`.
 * `groupSeq` 가 `null` 이면 호출하지 않는다(사업장의 소속 그룹을 아직 모를 때).
 */
export const useGroupAdminList = (groupSeq: number | null) =>
  useQuery({
    queryKey: groupKeys.admins(groupSeq ?? -1),
    queryFn: () => getGroupAdminList(groupSeq as number),
    enabled: groupSeq !== null,
  })
