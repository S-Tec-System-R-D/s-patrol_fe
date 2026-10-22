import AppBadge from '@/components/app/AppBadge'
import { ASSIGNMENT_STATUS, type AssignmentStatusCode } from '../types/deployment'

/**
 * 배치 상태 뱃지 (`spec 042` T719) — 배치관리 이력 표와 근무자 상세가 **같은 색**으로 읽히게 한 곳에 둔다.
 *
 * 🔴 **글자는 서버의 `statusName`** 이고 색만 코드로 고른다 — 이름을 프론트가 다시 짓지 않는다.
 */
const STATUS_VARIANT: Record<AssignmentStatusCode, 'point' | 'muted' | 'warning'> = {
  [ASSIGNMENT_STATUS.SCHEDULED]: 'warning',
  [ASSIGNMENT_STATUS.ACTIVE]: 'point',
  [ASSIGNMENT_STATUS.RETURNED]: 'muted',
}

const AssignmentStatusBadge = ({
  status,
  statusName,
}: {
  status: AssignmentStatusCode
  statusName: string
}) => <AppBadge variant={STATUS_VARIANT[status] ?? 'muted'}>{statusName}</AppBadge>

export default AssignmentStatusBadge
