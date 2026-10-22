import type { ColumnDef } from '@tanstack/react-table'

import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import type { AssignmentHistoryRow } from '../hooks/useDeploymentHistory'
import { formatPeriod } from '../lib/deploymentPeriod'
import AssignmentStatusBadge from './AssignmentStatusBadge'
import SiteRoute from './SiteRoute'

/**
 * 배치 이력 컬럼 (`spec 039` T648 → `spec 042` T719 실측 행).
 *
 * 근무자 · 배치 경로 · 기간 · 상태.
 * 🔴 **사유 칸이 없다** — 서버 이력 행에 없다(B-47, 요청 중).
 * 🔴 **경로의 한쪽 끝은 행에 없다** — 전입은 `fromSiteName` 만, 전출은 `toSiteName` 만 온다(실측). 다른 끝은
 * 조회한 사업장(= 선택 사업장)이다.
 * 🔴 **상태는 서버가 준 것을 그린다**(`status`·`statusName` — 배치예정 · 배치중 · 복귀완료).
 * ⚠️ 행에 `userSeq` 가 없어 아바타 색 키는 이름이다 — 요청 표(키 `userSeq`)와 색이 다를 수 있다.
 */

/** 🔴 정렬을 전부 끈다 — 서버 페이징이라 클릭하면 현재 페이지만 섞인다(026·037·038 과 같은 판단) */
const noSort = (columns: ColumnDef<AssignmentHistoryRow>[]): ColumnDef<AssignmentHistoryRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const deploymentHistoryColumns = (siteName: string): ColumnDef<AssignmentHistoryRow>[] =>
  noSort([
    {
      accessorKey: 'userName',
      header: '근무자',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <WorkerAvatar id={row.original.userName} name={row.original.userName} />
          <span className="font-medium">{row.original.userName}</span>
        </div>
      ),
    },
    {
      id: 'route',
      header: '배치 경로',
      // 요청 표와 같은 표기 — 도착 사업장을 진하게(사용자 요청 2026-10-21)
      cell: ({ row }) => {
        const r = row.original
        return 'fromSiteName' in r ? (
          <SiteRoute from={r.fromSiteName} to={siteName} />
        ) : (
          <SiteRoute from={siteName} to={r.toSiteName} />
        )
      },
    },
    {
      id: 'period',
      header: '기간',
      cell: ({ row }) => (
        <span className="tabular-nums whitespace-nowrap text-muted-foreground">
          {formatPeriod(row.original.startDt, row.original.endDt)}
        </span>
      ),
    },
    {
      id: 'status',
      header: '상태',
      cell: ({ row }) => (
        <AssignmentStatusBadge status={row.original.status} statusName={row.original.statusName} />
      ),
    },
  ])
