import { CircleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import { cn } from '@/lib/utils'
import type { AreaState, TodaySummary } from '../types'

/**
 * 오늘 숫자 — `spec 073`(067 의 묶음 카드 2개를 대체) → 🔄 **`spec 084`: 상자 없는 한 줄**(화면 제목 오른쪽 · 숫자 26px).
 * 진행 중 · 완료 · 미완료 · 시간초과.
 * 🔄 `spec 079` D13 — 네 칸 모두 **회차 수**다(서버 요약 그대로). `완료` 는 서버 완료만, `미완료` 는 도중에 종료한 회차.
 *    D11 의 `미인증 지점` 칸은 뺐다 — 회차 숫자에 지점 결과를 섞지 않는다.
 *
 * 🔴 **보조 줄(`오늘 N건 중` · `어제 N건`)이 없다** — 서버에 없는 값이다(사용자 결정 2026-11-11).
 * 🔴 **색은 시간초과(빨강) 숫자에만, 0 이면 회색**(분석 §1-3) — 0건에 빨강이 서 있으면 문제가 있는 것처럼 읽힌다.
 * 🔴 **조회 중 · 실패에 0 을 그리지 않는다**(`spec 068`) — 0 은 "오늘 문제 없음" 으로 읽힌다.
 * `진행 중` 은 진행 중 목록의 개수다 — 목록을 받기 전이면 `-`.
 * 누를 수 없다(067 결정 유지). 숫자는 움직임 없이 바로 바뀐다(`spec 084` — 굴러가는 효과는 보류).
 */

interface Cell {
  label: string
  value: number | null
  /** 0 이 아닐 때 숫자 색 */
  tone?: 'danger'
}

interface DashboardKpiCardProps {
  summary: TodaySummary | undefined
  /** 진행 중 회차 수 — 목록을 받기 전 · 실패면 `null` */
  activeCount: number | null
  state: AreaState
  onRetry: () => void
}

const DashboardKpiCard = ({ summary, activeCount, state, onRetry }: DashboardKpiCardProps) => {
  if (state === 'error') return <KpiError onRetry={onRetry} />
  if (state === 'loading' || !summary) {
    return <div className="h-9 w-80 max-w-full animate-pulse rounded-md bg-muted" aria-label="불러오는 중" />
  }

  const cells: Cell[] = [
    { label: '진행 중', value: activeCount },
    { label: '완료', value: summary.completedCount },
    { label: '미완료', value: summary.incompleteCount },
    { label: '시간초과', value: summary.overtimeCount, tone: 'danger' },
  ]

  return (
    <section aria-label="오늘 순찰">
      <dl className="flex flex-wrap items-baseline divide-x divide-border">
        {cells.map((cell) => (
          <div key={cell.label} className="flex items-baseline gap-2 px-4 first:pl-0 last:pr-0 xl:px-[22px]">
            <dt className="text-body text-sub-foreground">{cell.label}</dt>
            <dd className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  'text-[26px] leading-none font-semibold tabular-nums',
                  cell.value === null || cell.value === 0
                    ? 'text-muted-foreground'
                    : cell.tone === 'danger'
                      ? 'text-danger'
                      : 'text-foreground'
                )}
              >
                {cell.value ?? '-'}
              </span>
              <span className="text-body text-sub-foreground">건</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** 숫자 영역 오류 — 한 줄로 */
const KpiError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex items-center gap-3">
    <CircleAlertIcon size={16} className="shrink-0 text-muted-foreground" />
    <p className="min-w-0 text-caption text-muted-foreground">오늘 숫자를 불러오지 못했습니다</p>
    <AppButton variant="sub" onClick={onRetry}>
      다시 시도
    </AppButton>
  </div>
)

export default DashboardKpiCard
