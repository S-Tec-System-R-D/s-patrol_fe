import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useGroupTree } from '@/features/groups/hooks/useGroupTree'
import { getAdminList } from '../api/getAdminList'
import { buildAdminRows } from '../lib/adminList'
import { adminKeys } from '../queryKeys'

/**
 * 관리자 행 + 범위 (`spec 056` T997 — 045 `useAdminAssignments` 의 그룹마다 조회를 대체).
 *
 * 트리(`AdminSiteSelect`)는 좌측 패널 · 그룹 경로 · 담당 그룹 고르기의 출처라 그대로 쓰고, 관리자는 `GetAdminList` 하나로 받는다.
 * 🔴 둘 다 받아야 행을 만든다 — 담당 그룹을 트리 노드로 바꾸기 때문이다.
 */
export const useAdminList = () => {
  const tree = useGroupTree()
  const list = useQuery({ queryKey: adminKeys.list, queryFn: getAdminList })

  /** 🔴 메모이즈한다 — 렌더마다 새 배열이면 페이지의 범위 · 필터 메모가 매번 다시 돈다 */
  const rows = useMemo(
    () => (tree.data && list.data ? buildAdminRows(list.data, tree.data) : undefined),
    [tree.data, list.data]
  )

  const isError = tree.isError || list.isError
  const isPending = !isError && (tree.isPending || list.isPending)
  return {
    root: tree.data,
    rows,
    isPending,
    isError,
    error: tree.error ?? list.error ?? null,
    refetch: () => {
      if (tree.isError) void tree.refetch()
      if (list.isError) void list.refetch()
    },
  }
}
