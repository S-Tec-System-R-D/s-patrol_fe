import { format } from 'date-fns'
import { RefreshCwIcon } from 'lucide-react'

import AppIconButton from '@/components/app/AppIconButton'
import { cn } from '@/lib/utils'

/**
 * 마지막 갱신 표시 — `spec 067` → `spec 068`.
 *
 * 🔴 **주기 조회는 하지 않는다**(사용자 결정 2026-11-03) — 067 의 `30초마다 자동` 문구를 지웠다. 화면은 열 때 ·
 * 새로고침을 누를 때 최신이 된다. 실시간 갱신 · 연결 상태 표시는 `069`(SSE).
 */

interface DashboardUpdatedAtProps {
  updatedAt: Date
  /** 다시 받는 중 — 버튼이 돌고 눌리지 않는다 */
  refreshing: boolean
  onRefresh: () => void
}

const DashboardUpdatedAt = ({ updatedAt, refreshing, onRefresh }: DashboardUpdatedAtProps) => (
  <div className="flex items-center gap-2 text-caption text-muted-foreground">
    <span className="hidden sm:inline">
      마지막 갱신 <span className="tabular-nums text-foreground">{format(updatedAt, 'HH:mm:ss')}</span>
    </span>
    <AppIconButton
      icon={RefreshCwIcon}
      aria-label="새로고침"
      title="새로고침"
      disabled={refreshing}
      className={cn(refreshing && '[&_svg]:animate-spin')}
      onClick={onRefresh}
    />
  </div>
)

export default DashboardUpdatedAt
