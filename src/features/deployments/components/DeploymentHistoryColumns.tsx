import type { ColumnDef } from '@tanstack/react-table'

import AppBadge from '@/components/app/AppBadge'
import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import type { DeploymentHistoryRow } from '../types/deployment'
import SiteRoute from './SiteRoute'

/**
 * 배치 이력 컬럼 (`spec 039` T648) — 가정 계약 `DeploymentHistoryRow` 기준.
 *
 * 🔴 **상태는 `endDt` 하나로 갈린다** — `null` 이면 아직 배치 중(기간 끝이 `현재`), 있으면 복귀 완료.
 * 따로 상태 필드를 두지 않는다(같은 사실을 두 필드가 말하면 어긋날 수 있다).
 */

/** `'2026-03-01T09:00:00'` → `'2026.03'` */
const toYearMonth = (value: string): string => value.slice(0, 7).replace('-', '.')

const periodOf = (row: DeploymentHistoryRow): string =>
  `${toYearMonth(row.startDt)} ~ ${row.endDt ? toYearMonth(row.endDt) : '현재'}`

/** 🔴 정렬을 전부 끈다 — 서버 페이징이라 클릭하면 현재 페이지만 섞인다(026·037·038 과 같은 판단) */
const noSort = (columns: ColumnDef<DeploymentHistoryRow>[]): ColumnDef<DeploymentHistoryRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const deploymentHistoryColumns = (): ColumnDef<DeploymentHistoryRow>[] =>
  noSort([
    {
      accessorKey: 'userName',
      header: '이름',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* 근무자 목록(038)과 같은 사람이면 같은 색 — 해시 키를 `userSeq` 로 맞춘다 */}
          <WorkerAvatar id={String(row.original.userSeq)} name={row.original.userName} />
          <span className="font-medium">{row.original.userName}</span>
        </div>
      ),
    },
    {
      id: 'route',
      header: '배치 경로',
      // 요청 표와 같은 표기 — 도착 사업장을 진하게(사용자 요청 2026-10-21)
      cell: ({ row }) => <SiteRoute from={row.original.fromSiteName} to={row.original.toSiteName} />,
    },
    {
      accessorKey: 'reason',
      header: '사유',
    },
    {
      id: 'period',
      header: '기간',
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">{periodOf(row.original)}</span>
      ),
    },
    {
      id: 'status',
      header: '상태',
      cell: ({ row }) =>
        row.original.endDt ? (
          <AppBadge variant="muted">복귀완료</AppBadge>
        ) : (
          <AppBadge variant="point">배치중</AppBadge>
        ),
    },
  ])
