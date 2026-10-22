import type { ColumnDef } from '@tanstack/react-table'

import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import { formatPeriod } from '../lib/deploymentPeriod'
import type { AssignmentRequestRow } from '../types/deployment'
import DeploymentRequestActions from './DeploymentRequestActions'
import SiteRoute from './SiteRoute'

/**
 * 복귀 요청 컬럼 (`spec 039` T659 · `spec 042` T713) — **배치 요청 표와 같은 형태**(사용자 요청 2026-10-21).
 *
 * 근무자 · 복귀 경로 · 배치 기간 · 사유 · 요청일 · [승인][반려].
 * 🔴 **경로를 뒤집어 그린다** — 행의 `from → to` 는 **원래 배치 방향**(우리 → 배치지)이다(실측). 복귀는
 * `배치지 → 우리` 이고 도착(= 우리 사업장)을 굵게(`SiteRoute`) — 배치 요청과 같이 **굵은 쪽이 우리 사업장**이다.
 * 🔴 **복귀일 칸이 없다** — 서버에 없다(B-46 ②, 요청 중).
 */

const formatDate = (value: string): string => value.slice(0, 10)

/** 🔴 정렬을 전부 끈다 — 표는 화면이 자른 한 페이지라 클릭하면 그 페이지만 섞인다 */
const noSort = (columns: ColumnDef<AssignmentRequestRow>[]): ColumnDef<AssignmentRequestRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const returnRequestColumns = (siteSeq: number): ColumnDef<AssignmentRequestRow>[] =>
  noSort([
    {
      accessorKey: 'userName',
      header: '근무자',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <WorkerAvatar id={String(row.original.userSeq)} name={row.original.userName} />
          <span className="font-medium">{row.original.userName}</span>
        </div>
      ),
    },
    {
      id: 'route',
      header: '복귀 경로',
      cell: ({ row }) => (
        <SiteRoute from={row.original.toSiteName} to={row.original.fromSiteName} />
      ),
    },
    {
      id: 'period',
      header: '배치 기간',
      cell: ({ row }) => (
        <span className="tabular-nums whitespace-nowrap">
          {formatPeriod(row.original.startDt, row.original.plannedEndDt)}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: '사유',
      cell: ({ getValue }) => (
        <span className="block max-w-[280px] truncate" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'createDt',
      header: '요청일',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">처리</span>,
      cell: ({ row }) => (
        <DeploymentRequestActions
          kind="return"
          assignmentSeq={row.original.assignmentSeq}
          userName={row.original.userName}
          siteSeq={siteSeq}
        />
      ),
      meta: { className: 'w-px' },
    },
  ])
