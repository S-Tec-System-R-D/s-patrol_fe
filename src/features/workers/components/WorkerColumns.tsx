import AppBadge from '@/components/app/AppBadge'
import { userStatusLabel, workStatusLabel } from '@/types/enum'
import type { ColumnDef } from '@tanstack/react-table'
import WorkerAvatar from './WorkerAvatar'
import type { Worker } from '../types/worker'

export const workerColumns: ColumnDef<Worker>[] = [
  {
    accessorKey: 'name',
    header: '이름',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <WorkerAvatar id={row.original.id} name={row.original.name} />
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: '연락처',
    cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
  },
  {
    id: 'location',
    header: '소속 사업장',
    cell: ({ row }) => {
      const worker = row.original
      const displayName = worker.isAssignedElsewhere
        ? (worker.currentAssignedLocation?.name ?? worker.locationName)
        : worker.locationName
      return (
        <div className="flex items-center gap-2">
          <span>{displayName}</span>
          {worker.isAssignedElsewhere && <AppBadge variant="point">배치중</AppBadge>}
        </div>
      )
    },
  },
  {
    accessorKey: 'workStatus',
    header: '근무 상태',
    cell: ({ getValue }) => {
      const workStatus = getValue<Worker['workStatus']>()
      return (
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              workStatus === 'WORKING' ? 'bg-success' : 'bg-muted-foreground'
            }`}
          />
          <span>{workStatusLabel[workStatus]}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: '사용자 상태',
    cell: ({ getValue }) => {
      const status = getValue<Worker['status']>()
      return (
        <AppBadge variant={status === 'ACTIVE' ? 'success' : 'muted'}>
          {userStatusLabel[status]}
        </AppBadge>
      )
    },
  },
  {
    accessorKey: 'registeredAt',
    header: '등록일',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">{getValue<string>()}</span>
    ),
  },
]
