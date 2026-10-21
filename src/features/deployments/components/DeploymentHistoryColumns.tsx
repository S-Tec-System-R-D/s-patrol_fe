import type { ColumnDef } from '@tanstack/react-table'

import AppBadge from '@/components/app/AppBadge'
import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import { formatPeriod } from '../lib/deploymentPeriod'
import { DEPLOYMENT_HISTORY_STATUS, type DeploymentHistoryRow } from '../types/deployment'
import DeploymentEndDateAction from './DeploymentEndDateAction'
import SiteRoute from './SiteRoute'

/**
 * 배치 이력 컬럼 (`spec 039` T648) — 가정 계약 `DeploymentHistoryRow` 기준.
 *
 * 🔴 **상태는 서버가 준 코드를 그린다**(T656) — 배치예정 · 배치중 · 복귀완료. 종료일이 **미래일 수 있게**
 * 되면서(근무자가 입력한 예정 종료일) `endDt` 유무만으로는 복귀를 판단할 수 없다.
 *
 * 🔴 **전입 이력에만 복귀일 지정 버튼**(배치 로직 4) — 승인한 목적지 관리자가 관리한다. 전출은 보기만.
 * 복귀완료 행에는 버튼이 없다(이미 끝난 배치).
 */

const STATUS_VARIANT: Record<number, 'point' | 'muted' | 'warning'> = {
  [DEPLOYMENT_HISTORY_STATUS.ACTIVE]: 'point',
  [DEPLOYMENT_HISTORY_STATUS.RETURNED]: 'muted',
  [DEPLOYMENT_HISTORY_STATUS.SCHEDULED]: 'warning',
}

/** 🔴 정렬을 전부 끈다 — 서버 페이징이라 클릭하면 현재 페이지만 섞인다(026·037·038 과 같은 판단) */
const noSort = (columns: ColumnDef<DeploymentHistoryRow>[]): ColumnDef<DeploymentHistoryRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

/** @param endDateAction 전입 이력이면 복귀일 지정 버튼을 붙인다 — 사업장이 필요하다 */
export const deploymentHistoryColumns = (
  endDateAction: { siteSeq: number } | null = null
): ColumnDef<DeploymentHistoryRow>[] => {
  const columns: ColumnDef<DeploymentHistoryRow>[] = [
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
        <span className="tabular-nums whitespace-nowrap text-muted-foreground">
          {formatPeriod(row.original.startDt, row.original.endDt)}
        </span>
      ),
    },
    {
      id: 'status',
      header: '상태',
      cell: ({ row }) => (
        <AppBadge variant={STATUS_VARIANT[row.original.status] ?? 'muted'}>
          {row.original.statusName}
        </AppBadge>
      ),
    },
  ]

  if (endDateAction) {
    columns.push({
      id: 'endDate',
      header: () => <span className="sr-only">복귀일 지정</span>,
      cell: ({ row }) =>
        row.original.status === DEPLOYMENT_HISTORY_STATUS.RETURNED ? null : (
          <DeploymentEndDateAction row={row.original} siteSeq={endDateAction.siteSeq} />
        ),
      meta: { className: 'w-px' },
    })
  }

  return noSort(columns)
}
