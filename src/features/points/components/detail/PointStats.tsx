import { ActivityIcon, ClockIcon, RouteIcon, type LucideIcon } from 'lucide-react'

/**
 * 지점 상세 상단 요약 (`spec 027` Phase 3).
 *
 * ⚠️ **목업은 4칸이지만 3칸으로 간다.** 네 번째 "QR 발행"(발행일·버전·유효)은 서버에
 * **발행 메타가 없다**(B-23). 빈 칸을 두느니 칸 수를 줄였다 — 통계는 **채워진 숫자**가
 * 의미인데 하나가 비면 나머지 신뢰도까지 떨어진다. QR 카드 쪽에 placeholder 가 따로 있다.
 */

const Stat = ({
  icon: Icon,
  label,
  value,
  unit,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  hint: string
}) => (
  <div className="flex-1 border-border px-6 py-5 not-last:border-r">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon size={14} strokeWidth={1.75} />
      <span className="text-xs">{label}</span>
    </div>
    <p className="mt-2 flex items-baseline gap-1">
      <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
      {unit && <span className="text-caption text-muted-foreground">{unit}</span>}
    </p>
    <p className="mt-1 text-caption text-muted-foreground/80">{hint}</p>
  </div>
)

const PointStats = ({
  patrolCount,
  lastPatrol,
  courseCount,
}: {
  /** 최근 30일 인증 횟수 — `GetPointHistory` 를 클라이언트에서 집계한 값 */
  patrolCount: number
  /** 'yyyy-MM-dd HH:mm · 이름' 또는 null */
  lastPatrol: string | null
  courseCount: number
}) => (
  <div className="flex flex-col rounded-lg border border-border bg-card xl:flex-row">
    <Stat
      icon={ActivityIcon}
      label="30일 인증"
      value={String(patrolCount)}
      unit="회"
      hint={patrolCount === 0 ? '순찰 기록 없음' : '최근 30일 기준'}
    />
    <Stat
      icon={ClockIcon}
      label="최근 순찰"
      value={lastPatrol ?? '—'}
      hint={lastPatrol ? '마지막 인증 시각' : '아직 방문 이력이 없습니다'}
    />
    <Stat
      icon={RouteIcon}
      label="소속 코스"
      value={String(courseCount)}
      unit="개"
      hint={courseCount === 0 ? '코스에 배정되지 않음' : '이 지점이 포함된 코스'}
    />
  </div>
)

export default PointStats
