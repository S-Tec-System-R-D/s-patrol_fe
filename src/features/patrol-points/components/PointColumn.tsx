import AppBadge from '@/components/app/AppBadge'
import type {
  PatrolPointResultType,
  PointAuthMethodType,
  PointPatrolType,
} from '@/pages/service/patrol/points/PatrolPointsPage'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

export const patrolPointResultBadge: Record<
  PatrolPointResultType,
  { variant: 'success' | 'point' | 'warning' | 'danger'; label: string }
> = {
  NORMAL: { variant: 'success', label: '이상없음' },
  RECORDED: { variant: 'point', label: '순찰기록' },
  TIMEOUT: { variant: 'danger', label: '시간초과' },
  INCOMPLETE: { variant: 'danger', label: '미완료' },
  EXCLUDED: { variant: 'warning', label: '순찰제외' },
}

export const pointAuthMethodBadge: Record<
  PointAuthMethodType,
  { variant: 'point' | 'success'; label: string }
> = {
  QR: { variant: 'point', label: 'QR' },
  NFC: { variant: 'success', label: 'NFC' },
}

export const pointColumns = (
  onRecordClick: (patrol: PointPatrolType) => void
): ColumnDef<PointPatrolType>[] => [
  {
    accessorKey: 'patrolAt',
    header: '순찰일자',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">
        {format(getValue<Date>(), 'yyyy-MM-dd')}
      </span>
    ),
  },
  {
    id: 'time',
    header: '시간',
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.result === 'INCOMPLETE' ? '—' : format(row.original.patrolAt, 'HH:mm')}
      </span>
    ),
  },
  {
    accessorKey: 'zoneName',
    header: '순찰코스',
    cell: ({ getValue }) => <span>{getValue<string>()}</span>,
  },
  {
    accessorKey: 'pointName',
    header: '순찰지점',
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    accessorKey: 'authMethod',
    header: '인증',
    cell: ({ getValue }) => {
      const { variant, label } = pointAuthMethodBadge[getValue<PointAuthMethodType>()]
      return <AppBadge variant={variant}>{label}</AppBadge>
    },
  },
  {
    accessorKey: 'worker',
    header: '순찰자',
    cell: ({ getValue }) => <span>{getValue<string>()}</span>,
  },
  {
    accessorKey: 'result',
    header: '결과',
    cell: ({ getValue }) => {
      const { variant, label } = patrolPointResultBadge[getValue<PatrolPointResultType>()]
      return <AppBadge variant={variant}>{label}</AppBadge>
    },
  },
  {
    id: 'records',
    header: '기록',
    cell: ({ row }) => {
      const { records } = row.original
      if (records.length === 0) {
        return <span className="text-muted-foreground">0</span>
      }
      return (
        <button type="button" onClick={() => onRecordClick(row.original)}>
          <AppBadge variant="point">{`${records.length}건`}</AppBadge>
        </button>
      )
    },
  },
]
