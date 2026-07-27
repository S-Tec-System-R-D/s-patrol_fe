import AppBadge from '@/components/app/AppBadge'
import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import type { ColumnDef } from '@tanstack/react-table'
import type { DeploymentHistoryItem } from '../types/deployment'

const toYearMonth = (date: string) => date.slice(0, 7).replace('-', '.')

const historyPeriod = (item: DeploymentHistoryItem) =>
  `${toYearMonth(item.startedAt)} ~ ${item.endedAt ? toYearMonth(item.endedAt) : '현재'}`

export const deploymentHistoryColumns: ColumnDef<DeploymentHistoryItem>[] = [
  {
    accessorKey: 'workerName',
    header: '이름',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <WorkerAvatar id={row.original.id} name={row.original.workerName} />
        <span className="font-medium">{row.original.workerName}</span>
      </div>
    ),
  },
  {
    id: 'route',
    header: '배치 경로',
    cell: ({ row }) => (
      <span>
        {row.original.fromLocationName} → {row.original.toLocationName}
      </span>
    ),
  },
  {
    accessorKey: 'reason',
    header: '사유',
    cell: ({ getValue }) => <span>{getValue<string>()}</span>,
  },
  {
    id: 'period',
    header: '기간',
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">{historyPeriod(row.original)}</span>
    ),
  },
  {
    id: 'status',
    header: '상태',
    cell: ({ row }) =>
      row.original.endedAt ? (
        <AppBadge variant="muted">복귀완료</AppBadge>
      ) : (
        <AppBadge variant="point">배치중</AppBadge>
      ),
  },
]
