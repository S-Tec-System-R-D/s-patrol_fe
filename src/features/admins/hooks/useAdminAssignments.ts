import { useQueries } from '@tanstack/react-query'

import { getGroupAdminList } from '@/features/groups/api/getGroupAdminList'
import { useGroupTree } from '@/features/groups/hooks/useGroupTree'
import { walkGroups } from '@/features/groups/lib/groupTree'
import { groupKeys } from '@/features/groups/queryKeys'
import { buildAdminRows } from '../lib/adminList'

/**
 * 관리자 행 + 담당 그룹 (`spec 045` T817) — 트리의 **그룹마다** `GetGroupAdminList` 를 병렬로 부른다(B-61).
 *
 * - 🔴 **전부 받아야 데이터다** — 일부만 받은 담당 그룹은 틀린 값이라 그리지 않는다(spec §4).
 * - 키는 043 · 044 의 `groupKeys.admins` 그대로 — 그룹 이름 변경 직전 읽기 · 사업장 담당 관리자 카드와 캐시를 나눈다.
 * - `refetch` 는 실패한 것만 다시 부른다.
 */
export const useAdminAssignments = () => {
  const tree = useGroupTree()
  const groups = tree.data ? walkGroups(tree.data) : []

  return useQueries({
    queries: groups.map((group) => ({
      queryKey: groupKeys.admins(group.groupSeq),
      queryFn: () => getGroupAdminList(group.groupSeq),
    })),
    combine: (results) => {
      const failed = results.filter((result) => result.isError)
      const isError = tree.isError || failed.length > 0
      const isPending = !isError && (tree.isPending || results.some((result) => result.isPending))
      return {
        root: tree.data,
        rows:
          isPending || isError
            ? undefined
            : buildAdminRows(groups.map((group, i) => ({ group, rows: results[i].data ?? [] }))),
        isPending,
        isError,
        error: tree.error ?? failed[0]?.error ?? null,
        refetch: () => {
          if (tree.isError) void tree.refetch()
          failed.forEach((result) => void result.refetch())
        },
      }
    },
  })
}
