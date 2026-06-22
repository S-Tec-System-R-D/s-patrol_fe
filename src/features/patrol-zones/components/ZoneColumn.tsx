import type { ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'
import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'

const columnHelper = createColumnHelper<ZonePatrolType>()

export const zoneColumns = [
  columnHelper.accessor('name', {
    header: '구역명',
  }),
  columnHelper.accessor('startedAt', {
    header: '시작 시간',
    cell: (info) => format(info.getValue(), 'yyyy-MM-dd HH:mm:ss'),
  }),
  columnHelper.accessor('endedAt', {
    header: '종료 시간',
    cell: (info) => format(info.getValue(), 'yyyy-MM-dd HH:mm:ss'),
  }),
  columnHelper.accessor('result', {
    header: '결과',
    // 뱃지
  }),
  // 반응형 작업. xs 이하일 때만 sheet
  // columnHelper.display({
  //   id: 'actions',
  //   cell: (props) => <PatrolSheet patrol={props.row.original} />,
  // }),
]
