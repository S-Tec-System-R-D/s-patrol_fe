import { format } from 'date-fns'
import { CheckIcon, FlagIcon, PlayIcon, TriangleAlertIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  PointPatrolType,
  ZonePatrolType,
} from '@/pages/service/patrol/zones/PatrolZonesPage'

/**
 * 코스 순찰이력 상세의 타임라인 (.tlcard 스펙).
 * - 순찰 시작 → 각 지점 → 순찰 종료 순으로 세로 카드 리스트.
 * - 정상 지점은 접힘(아이콘+이름+시각), 특이사항 지점(`status=false` OR `note` 존재)은
 *   자동 펼침 상태로 고정 표시(토글 없음) — "특이사항" 플래그 + 노트 텍스트.
 * - 토큰 매핑: design-system.md §1-1 (`--border-soft`→`border/50`, `--text-2`→`muted-foreground`,
 *   `--text-3`→`muted-foreground/70`, `--gray-bg`→`muted`).
 */
const PatrolTimeline = ({ patrol }: { patrol: ZonePatrolType }) => {
  return (
    <div className="flex flex-col gap-[7px]">
      <TimelineBookendCard type="START" time={patrol.startedAt} />
      {patrol.points.map((point, index) => (
        <TimelinePointCard key={`${point.name}-${index}`} point={point} />
      ))}
      <TimelineBookendCard type="END" time={patrol.endedAt} />
    </div>
  )
}

export default PatrolTimeline

const TimelineIcon = ({
  variant,
  icon: Icon,
}: {
  variant: 'muted' | 'ok' | 'issue'
  icon: typeof PlayIcon
}) => (
  <span
    className={cn(
      'grid size-[26px] shrink-0 place-items-center rounded-lg',
      variant === 'muted' && 'bg-muted text-muted-foreground',
      variant === 'ok' && 'bg-success-bg text-success',
      variant === 'issue' && 'bg-danger-bg text-danger'
    )}
  >
    <Icon size={14} strokeWidth={2} />
  </span>
)

const TimelineBookendCard = ({ type, time }: { type: 'START' | 'END'; time: Date }) => {
  const Icon = type === 'START' ? PlayIcon : FlagIcon
  const label = type === 'START' ? '순찰 시작' : '순찰 종료'
  return (
    <div className="overflow-hidden rounded-[9px] border border-border/50">
      <div className="flex items-center gap-[10px] px-[11px] py-[9px]">
        <TimelineIcon variant="muted" icon={Icon} />
        <span className="flex-1 text-body font-medium text-muted-foreground">{label}</span>
        <span className="shrink-0 font-mono text-meta tabular-nums text-muted-foreground/70">
          {format(time, 'HH:mm')}
        </span>
      </div>
    </div>
  )
}

const TimelinePointCard = ({ point }: { point: PointPatrolType }) => {
  const isIssue = !point.status || point.note.length > 0
  return (
    <div className="overflow-hidden rounded-[9px] border border-border/50">
      <div className="flex items-center gap-[10px] px-[11px] py-[9px]">
        <TimelineIcon variant={isIssue ? 'issue' : 'ok'} icon={isIssue ? TriangleAlertIcon : CheckIcon} />
        <span className="flex-1 text-body font-semibold text-foreground">{point.name}</span>
        {isIssue && (
          <span className="shrink-0 rounded-[5px] bg-danger-bg px-1.5 py-0.5 text-label font-bold text-danger">
            특이사항
          </span>
        )}
        <span className="shrink-0 font-mono text-meta tabular-nums text-muted-foreground/70">
          {format(point.completedAt, 'HH:mm')}
        </span>
      </div>
      {isIssue && point.note && (
        <p className="pb-[11px] pl-[47px] pr-[11px] text-caption leading-[1.55] text-muted-foreground">
          {point.note}
        </p>
      )}
    </div>
  )
}
