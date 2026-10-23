import { useQuery } from '@tanstack/react-query'

import { fetchAdminSiteSelect } from '@/features/auth/api/adminSiteSelect'
import { groupKeys } from '../queryKeys'

/** 관리그룹 트리 (`spec 043` T739) — 출처는 `AdminSiteSelect`(`GetGroupList` 는 500, B-1) */
export const useGroupTree = () =>
  useQuery({
    queryKey: groupKeys.tree,
    queryFn: fetchAdminSiteSelect,
  })
