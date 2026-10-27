import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import { formatPeriod } from '../lib/deploymentPeriod'
import type { AssignmentRequestRow, RequestKind } from '../types/deployment'
import DeploymentRequestActions from './DeploymentRequestActions'
import SiteRoute from './SiteRoute'

/**
 * 배치 · 복귀 요청의 **좁은 폭(`xl` 미만) 카드** (`spec 055`, 사용자 결정 2026-10-27).
 *
 * 이름 · 요청일 → 경로 → 기간 + [승인][반려](같은 줄 오른쪽, 표와 같은 `h-8` — 폭 절반씩 큰 버튼은
 * 카드에 비해 과했다, 사용자 지적 2026-10-27). 값과 규칙은 표(`DeploymentRequestColumns` ·
 * `ReturnRequestColumns`)와 같다 — 복귀는 경로가 거꾸로다(도착 사업장에서 원래 사업장으로).
 * 🔴 **사유를 넣지 않는다**(사용자 결정) — 실제 요청에 비어 온다.
 * ⚠️ 행 클릭이 없어 `AppTable` 이 카드를 `div` 로 감싼다 — 그래서 안에 버튼을 둘 수 있다(`patterns.md` §14).
 */
const DeploymentRequestCard = ({
  row,
  kind,
  siteSeq,
}: {
  row: AssignmentRequestRow
  kind: RequestKind
  siteSeq: number
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <WorkerAvatar id={String(row.userSeq)} name={row.userName} />
      <span className="min-w-0 flex-1 truncate text-body font-semibold text-foreground">{row.userName}</span>
      <span className="shrink-0 whitespace-nowrap text-caption tabular-nums text-muted-foreground">
        요청 {row.createDt.slice(0, 10)}
      </span>
    </div>
    <div className="text-body">
      {kind === 'return' ? (
        <SiteRoute from={row.toSiteName} to={row.fromSiteName} />
      ) : (
        <SiteRoute from={row.fromSiteName} to={row.toSiteName} />
      )}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-caption tabular-nums text-muted-foreground">
        {formatPeriod(row.startDt, row.plannedEndDt)}
      </span>
      {/* 좁아서 다음 줄로 내려가도 오른쪽에 붙는다 */}
      <div className="ml-auto">
        <DeploymentRequestActions
          kind={kind}
          assignmentSeq={row.assignmentSeq}
          userName={row.userName}
          siteSeq={siteSeq}
        />
      </div>
    </div>
  </div>
)

export default DeploymentRequestCard
