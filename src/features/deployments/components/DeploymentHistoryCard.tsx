import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import type { AssignmentHistoryRow } from '../hooks/useDeploymentHistory'
import { formatPeriod } from '../lib/deploymentPeriod'
import AssignmentStatusBadge from './AssignmentStatusBadge'
import SiteRoute from './SiteRoute'

/**
 * 전입 · 전출 이력의 **좁은 폭(`xl` 미만) 카드** (`spec 055`).
 *
 * 이름 · 상태 → 경로 → 기간. 규칙은 표(`DeploymentHistoryColumns`)와 같다 — 경로의 한쪽 끝은 행에
 * 없어 조회한 사업장(`siteName`)으로 채운다.
 */
const DeploymentHistoryCard = ({ row, siteName }: { row: AssignmentHistoryRow; siteName: string }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <WorkerAvatar id={row.userName} name={row.userName} />
      <span className="min-w-0 flex-1 truncate text-body font-semibold text-foreground">{row.userName}</span>
      <AssignmentStatusBadge status={row.status} statusName={row.statusName} />
    </div>
    <div className="text-body">
      {'fromSiteName' in row ? (
        <SiteRoute from={row.fromSiteName} to={siteName} />
      ) : (
        <SiteRoute from={siteName} to={row.toSiteName} />
      )}
    </div>
    <span className="text-caption tabular-nums text-muted-foreground">
      {formatPeriod(row.startDt, row.endDt)}
    </span>
  </div>
)

export default DeploymentHistoryCard
