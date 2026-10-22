import type { ColumnDef } from '@tanstack/react-table'

import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import { formatPeriod } from '../lib/deploymentPeriod'
import type { AssignmentRequestRow } from '../types/deployment'
import DeploymentRequestActions from './DeploymentRequestActions'
import SiteRoute from './SiteRoute'

/**
 * 배치 요청 컬럼 (`spec 039` T649e — 카드형 → **표**, 사용자 결정 2026-10-21 · `spec 042` T712 실측 필드).
 *
 * 근무자 · 배치 경로 · 배치 기간(시작 ~ 종료 · 없으면 `미정`) · 사유 · 요청일 · [승인][반려].
 * 🔴 근무자는 백엔드가 B-46 으로 추가했다(2026-10-22) — 승인·반려를 판단하는 핵심 정보다.
 *
 * 처리할 일이라는 점은 **액션 칸**과 KPI(대기 · 주황)가 말한다.
 */

/** `'2026-05-30T10:20:00'` → `'2026-05-30'` */
const formatDate = (value: string): string => value.slice(0, 10)

/** 🔴 정렬을 전부 끈다 — 표는 화면이 자른 한 페이지라 클릭하면 그 페이지만 섞인다 */
const noSort = (columns: ColumnDef<AssignmentRequestRow>[]): ColumnDef<AssignmentRequestRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const deploymentRequestColumns = (siteSeq: number): ColumnDef<AssignmentRequestRow>[] =>
  noSort([
    {
      accessorKey: 'userName',
      header: '근무자',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* 이력 표·근무자 목록과 같은 사람이면 같은 색 — 해시 키를 `userSeq` 로 맞춘다 */}
          <WorkerAvatar id={String(row.original.userSeq)} name={row.original.userName} />
          <span className="font-medium">{row.original.userName}</span>
        </div>
      ),
    },
    {
      id: 'route',
      header: '배치 경로',
      cell: ({ row }) => (
        <SiteRoute from={row.original.fromSiteName} to={row.original.toSiteName} />
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
          assignmentSeq={row.original.assignmentSeq}
          userName={row.original.userName}
          siteSeq={siteSeq}
        />
      ),
      // 버튼 폭만큼만 — 남는 폭을 나눠 받으면 버튼이 표 가운데로 밀린다
      meta: { className: 'w-px' },
    },
  ])
