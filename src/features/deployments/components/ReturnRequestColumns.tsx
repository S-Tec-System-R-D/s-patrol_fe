import type { ColumnDef } from '@tanstack/react-table'

import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import type { ReturnRequestRow } from '../types/deployment'
import DeploymentRequestActions from './DeploymentRequestActions'
import SiteRoute from './SiteRoute'

/**
 * 복귀 요청 컬럼 (`spec 039` T659) — **배치 요청 표와 같은 형태**(사용자 요청 2026-10-21).
 *
 * 근무자 · 복귀 경로 · 복귀일 · 사유 · 요청일 · [승인][거부].
 * 🔴 **경로는 `지금 배치지 → 원소속(= 우리 사업장)`** 이고 도착을 굵게(`SiteRoute`) — 배치 요청과 같은 규칙이라
 * 두 표 모두 **굵은 쪽이 우리 사업장**이다.
 */

const formatDate = (value: string): string => value.slice(0, 10)

/** 🔴 정렬을 전부 끈다 — 서버 페이징이라 클릭하면 현재 페이지만 섞인다 */
const noSort = (columns: ColumnDef<ReturnRequestRow>[]): ColumnDef<ReturnRequestRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const returnRequestColumns = (siteSeq: number): ColumnDef<ReturnRequestRow>[] =>
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
        <SiteRoute from={row.original.fromSiteName} to={row.original.toSiteName} />
      ),
    },
    {
      accessorKey: 'returnDt',
      header: '복귀일',
      cell: ({ getValue }) => (
        <span className="tabular-nums">{formatDate(getValue<string>())}</span>
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
      accessorKey: 'requestDt',
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
          requestSeq={row.original.requestSeq}
          userName={row.original.userName}
          siteSeq={siteSeq}
        />
      ),
      meta: { className: 'w-px' },
    },
  ])
