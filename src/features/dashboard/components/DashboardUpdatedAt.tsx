import { format } from 'date-fns'
import { RefreshCwIcon } from 'lucide-react'

import AppIconButton from '@/components/app/AppIconButton'
import { cn } from '@/lib/utils'

import type { RealtimeStatus } from '../realtime/useDashboardRealtime'

/**
 * 마지막 갱신 · 실시간 연결 상태 표시 — `spec 067` → `spec 068` → `spec 069`.
 *
 * 🔴 **주기 조회는 하지 않는다**(사용자 결정 2026-11-03) — 067 의 `30초마다 자동` 문구를 지웠다. 화면은 열 때 ·
 * 새로고침을 누를 때 · 실시간 알림이 올 때 최신이 된다. 연결 상태는 좁은 폭에서도 보인다(`마지막 갱신` 만 숨긴다).
 * `마지막 갱신` 은 영역 중 가장 최근에 데이터를 받은 시각이다 — 알림으로 화면이 바뀌어도 따라간다(`spec 069`).
 */

interface DashboardUpdatedAtProps {
  updatedAt: Date
  realtime: RealtimeStatus
  /** 다시 받는 중 — 버튼이 돌고 눌리지 않는다 */
  refreshing: boolean
  onRefresh: () => void
}

const DashboardUpdatedAt = ({ updatedAt, realtime, refreshing, onRefresh }: DashboardUpdatedAtProps) => (
  <div className="flex items-center gap-2 text-caption text-muted-foreground">
    <span role="status" className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn('size-2 rounded-full', realtime === 'connected' ? 'bg-success' : 'bg-warning')}
      />
      {realtime === 'connected' ? '실시간' : '다시 연결 중'}
    </span>
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
