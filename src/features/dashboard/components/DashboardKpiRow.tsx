import type { LucideIcon } from 'lucide-react'
import { CircleAlertIcon, CircleCheckIcon, ClockAlertIcon, Undo2Icon, UserRoundPlusIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import { cn } from '@/lib/utils'

import type { AreaState, TodaySummary } from '../types'

/**
 * 오늘 숫자 — `spec 067`. **묶음 카드 2개**(사용자 결정 2026-11-02): `오늘 순찰` 3칸 · `배치 대기` 2칸.
 *
 * 🔴 **5칸을 한 줄에 늘어놓지 않고 묶는다** — 복귀 요청이 더해져 5칸이 되니 "무엇을 센 숫자인지" 가
 * 흐려졌다. 테두리 하나 안에서 칸을 나눠 같은 묶음임을 보인다. `AppKpiCard` 는 칸 하나짜리라 쓰지 않는다.
 * 🔴 **`진행 중` 칸이 없다** — 바로 아래 섹션 제목의 개수와 같은 값이라 두 번 말하게 된다.
 * 🔴 **값이 0 이면 색을 뺀다** — 0건에 빨강이 서 있으면 문제가 있는 것처럼 읽힌다.
 * 🔴 시간초과는 `danger` 다 — 순찰이력 결과 뱃지와 같은 색(`historyBadge.ts` `overtimeBadge`).
 * 🔴 **누를 수 없다**(사용자 결정 2026-10-30) — 숫자를 보는 칸이고, 목록으로 가는 길은 메뉴에 있다.
 * 🔴 **조회 중 · 실패에 0 을 그리지 않는다**(`spec 068`) — 0 은 "오늘 문제 없음" 으로 읽힌다.
 */

type Tone = 'neutral' | 'point' | 'danger'

/** 아이콘 칩 색 — `AppKpiCard` 와 같은 토큰 */
const toneStyles: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  point: 'bg-point-bg text-point',
  danger: 'bg-danger-bg text-danger-foreground',
}

const toneWhen = (value: number, tone: Exclude<Tone, 'neutral'>): Tone => (value > 0 ? tone : 'neutral')

interface Cell {
  label: string
  value: number
  icon: LucideIcon
  tone: Tone
}

const KpiGroup = ({ title, cells, className }: { title: string; cells: Cell[]; className?: string }) => (
  <section
    aria-label={title}
    className={cn('flex flex-col rounded-lg border border-border bg-card sm:flex-row', className)}
  >
    {/* 🔴 **묶음 이름은 왼쪽**(사용자 결정 2026-11-02) — 위에 두면 카드가 한 줄만큼 두꺼워진다. 좁은 폭(`sm` 미만)은
        왼쪽에 두면 칸이 좁아져 라벨이 잘려서 위로 올린다 */}
    <h2 className="shrink-0 px-4 pt-3 text-caption font-semibold text-muted-foreground sm:flex sm:items-center sm:border-r sm:border-border sm:bg-muted/40 sm:px-4 sm:pt-0">
      {title}
    </h2>
    {/* 칸 안은 넓은 폭에서 한 줄(라벨 ··· 숫자), 좁은 폭에서 세로(라벨 위 · 숫자 아래) — 390px 에 3칸이 들어간다 */}
    <dl className={cn('grid flex-1 divide-x divide-border', cells.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex min-w-0 flex-col gap-1.5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-4"
        >
          <dt className="flex min-w-0 items-center gap-1.5 text-caption font-medium text-foreground/80">
            <span className={cn('grid size-6 shrink-0 place-items-center rounded-md', toneStyles[cell.tone])}>
              <cell.icon size={13} strokeWidth={1.75} />
            </span>
            <span className="truncate">{cell.label}</span>
          </dt>
          <dd className="flex shrink-0 items-baseline gap-1">
            <span className="text-xl font-bold text-foreground tabular-nums">{cell.value}</span>
            <span className="text-caption font-medium text-muted-foreground">건</span>
          </dd>
        </div>
      ))}
    </dl>
  </section>
)

interface DashboardKpiRowProps {
  summary: TodaySummary | undefined
  state: AreaState
  onRetry: () => void
}

const DashboardKpiRow = ({ summary, state, onRetry }: DashboardKpiRowProps) => {
  if (state === 'error') return <KpiError onRetry={onRetry} />
  if (state === 'loading' || !summary) {
    return (
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5" aria-label="불러오는 중">
        <div className="h-[58px] animate-pulse rounded-lg bg-muted xl:col-span-3" />
        <div className="h-[58px] animate-pulse rounded-lg bg-muted xl:col-span-2" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
      <KpiGroup
        title="오늘 순찰"
        className="xl:col-span-3"
        cells={[
          { label: '오늘 완료', value: summary.completedCount, icon: CircleCheckIcon, tone: 'neutral' },
          {
            label: '오늘 미완료',
            value: summary.incompleteCount,
            icon: CircleAlertIcon,
            tone: toneWhen(summary.incompleteCount, 'danger'),
          },
          {
            label: '시간초과',
            value: summary.overtimeCount,
            icon: ClockAlertIcon,
            tone: toneWhen(summary.overtimeCount, 'danger'),
          },
        ]}
      />
      <KpiGroup
        title="배치 대기"
        className="xl:col-span-2"
        cells={[
          {
            label: '배치 요청',
            value: summary.pendingAssignmentCount,
            icon: UserRoundPlusIcon,
            tone: toneWhen(summary.pendingAssignmentCount, 'point'),
          },
          {
            label: '복귀 요청',
            value: summary.pendingReturnCount,
            icon: Undo2Icon,
            tone: toneWhen(summary.pendingReturnCount, 'point'),
          },
        ]}
      />
    </div>
  )
}

/** 숫자 영역 오류 — 한 줄로(카드 높이를 크게 바꾸지 않는다) */
const KpiError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
    <CircleAlertIcon size={16} className="shrink-0 text-muted-foreground" />
    <p className="min-w-0 flex-1 text-caption text-muted-foreground">오늘 숫자를 불러오지 못했습니다</p>
    <AppButton variant="sub" onClick={onRetry}>
      다시 시도
    </AppButton>
  </div>
)

export default DashboardKpiRow
