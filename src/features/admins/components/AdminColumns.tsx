import type { ColumnDef } from '@tanstack/react-table'

import AppBadge from '@/components/app/AppBadge'
import type { GroupNode } from '@/features/auth/types/site'
import { adminGroupSummary, type AdminRow } from '../lib/adminList'
import { adminRoleLabel, adminRoleVariant } from '../lib/adminRole'

/**
 * 관리자 목록 컬럼 (`spec 045` T822) — 목업 v2 `ManagersPage` 6열에서 3열.
 *
 * 🔴 소속 그룹 · 연락처 · 상태 열은 **없다** — 소속 그룹은 담당 그룹으로 합쳤고(사용자 결정 2026-10-23),
 * 연락처 · 등록일은 행에 없으며(B-61) 상태는 API 가 없다(넣지 않는다).
 */
export const adminColumns = (root: GroupNode): ColumnDef<AdminRow>[] => {
  const columns: ColumnDef<AdminRow>[] = [
    {
      id: 'name',
      header: '이름',
      cell: ({ row }) => <span className="font-medium">{row.original.admin.userName}</span>,
    },
    {
      id: 'role',
      header: '권한',
      cell: ({ row }) => {
        const { codeSeq, codeName } = row.original.admin
        return <AppBadge variant={adminRoleVariant(codeSeq)}>{adminRoleLabel(codeSeq, codeName)}</AppBadge>
      },
    },
    {
      id: 'groups',
      header: '담당 그룹',
      cell: ({ row }) => <span className="text-muted-foreground">{adminGroupSummary(root, row.original.groups)}</span>,
    },
  ]
  // 응답 순서 그대로 둔다
  return columns.map((column) => ({ ...column, enableSorting: false }))
}
