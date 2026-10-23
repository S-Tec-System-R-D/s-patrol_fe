import { useQuery } from '@tanstack/react-query'

import { fetchAdminSiteSelect } from '@/features/auth/api/adminSiteSelect'
import { groupKeys } from '../queryKeys'

/**
 * 관리그룹 트리 (`spec 043` T739) — 출처는 `AdminSiteSelect`.
 * `GetGroupList` 는 043 당시 500 이었다(B-1, 2026-10-23 수정). 패널은 바꾸지 않는다(사용자 결정 2026-10-23)
 */
export const useGroupTree = () =>
  useQuery({
    queryKey: groupKeys.tree,
    queryFn: fetchAdminSiteSelect,
  })
