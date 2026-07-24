import AppBadge from '@/components/app/AppBadge'
import type {
  PatrolResultType,
  ZonePatrolType,
} from '@/pages/service/patrol/zones/PatrolZonesPage'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

export const patrolResultBadge: Record<
  PatrolResultType,
  { variant: 'success' | 'danger' | 'point'; label: string }
> = {
  COMPLETE: { variant: 'success', label: '완료' },
  INCOMPLETE: { variant: 'danger', label: '미완료' },
  IN_PROGRESS: { variant: 'point', label: '진행중' },
}

export const zoneColumns: ColumnDef<ZonePatrolType>[] = [
  {
    accessorKey: 'name',
    header: '코스명',
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'startedAt',
    header: '시작 일시',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(getValue<Date>(), 'yyyy-MM-dd HH:mm:ss')}
      </span>
    ),
  },
  {
    accessorKey: 'endedAt',
    header: '종료 일시',
    cell: ({ row, getValue }) => {
      if (row.original.result === 'IN_PROGRESS') {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <span className="tabular-nums text-muted-foreground">
          {format(getValue<Date>(), 'yyyy-MM-dd HH:mm:ss')}
        </span>
      )
    },
  },
  {
    accessorKey: 'result',
    header: '순찰 결과',
    cell: ({ getValue }) => {
      const { variant, label } = patrolResultBadge[getValue<PatrolResultType>()]
      return <AppBadge variant={variant}>{label}</AppBadge>
    },
  },
]
