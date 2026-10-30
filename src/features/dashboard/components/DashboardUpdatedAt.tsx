import { format } from 'date-fns'
import { RefreshCwIcon } from 'lucide-react'

import AppIconButton from '@/components/app/AppIconButton'

/**
 * 마지막 갱신 표시 — `spec 067`.
 *
 * ⚠️ **"30초마다 자동" 은 아직 문구뿐이다** — 고정 데이터라 다시 받을 것이 없다. 새로고침은
 * 시각만 바꾼다. 실제 주기 조회는 API spec 에서 붙인다.
 */

interface DashboardUpdatedAtProps {
  updatedAt: Date
  onRefresh: () => void
}

const DashboardUpdatedAt = ({ updatedAt, onRefresh }: DashboardUpdatedAtProps) => (
  <div className="flex items-center gap-2 text-caption text-muted-foreground">
    <span className="hidden sm:inline">
      마지막 갱신 <span className="tabular-nums text-foreground">{format(updatedAt, 'HH:mm:ss')}</span>
      {' · '}30초마다 자동
    </span>
    <AppIconButton icon={RefreshCwIcon} aria-label="새로고침" title="새로고침" onClick={onRefresh} />
  </div>
)

export default DashboardUpdatedAt
