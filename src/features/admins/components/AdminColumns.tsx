import type { ColumnDef } from '@tanstack/react-table'

import AppBadge from '@/components/app/AppBadge'
import type { GroupNode } from '@/features/auth/types/site'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { adminGroupSummary, type AdminRow } from '../lib/adminList'
import { adminRoleLabel, adminRoleVariant } from '../lib/adminRole'

/**
 * 관리자 목록 컬럼 (`spec 045` T822 → `spec 056`) — 목업 v2 `ManagersPage` 6열에서 4열.
 *
 * 🔴 소속 그룹 · 상태 열은 **없다** — 소속 그룹은 담당 그룹으로 합쳤고(사용자 결정 2026-10-23) 상태는 API 가 없다.
 * 🔄 연락처 열은 `GetAdminList` 행에 값이 생겨 넣었다(사용자 요청 2026-10-28). 마스터의 담당 그룹은 `전체`.
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
      id: 'phone',
      header: '연락처',
      cell: ({ row }) => <span className="tabular-nums">{formatPhone(row.original.admin.phone)}</span>,
    },
    {
      id: 'groups',
      header: '담당 그룹',
      cell: ({ row }) => <span className="text-muted-foreground">{adminGroupSummary(root, row.original)}</span>,
    },
  ]
  // 응답 순서 그대로 둔다
  return columns.map((column) => ({ ...column, enableSorting: false }))
}
