import { CircleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import { cn } from '@/lib/utils'

import type { AreaState, TodaySummary } from '../types'

/**
 * 오늘 숫자 — `spec 073`(067 의 묶음 카드 2개를 대체). **카드 하나 · 4칸**: 진행 중 · 완료 · 미인증 지점 · 시간초과.
 * 🔄 `spec 079` D11 — 회차는 진행중 / 완료뿐이라 서버 `미완료` 를 `완료` 에 더한다. 셋째 칸은 **미인증 지점 수**
 *    (오늘 끝난 회차의 `pointCount - checkedCount` 합 — 서버 요약에 없어 최근 회차 100건으로 센다, 페이지가 넘긴다).
 *
 * 🔴 **xl 에서 열 절반 폭이다**(사용자 결정 2026-11-11) — 전체 폭 띠는 라벨과 숫자가 멀어진다(분석 문서 §1-1).
 * 같은 줄 오른쪽은 배치 대기 패널이라, **배치 숫자는 여기 두지 않는다**(두 번 말하게 된다).
 * 🔴 **보조 줄(`오늘 N건 중` · `어제 N건`)이 없다** — 서버에 없는 값이다(사용자 결정 2026-11-11).
 * 🔴 **색은 미인증(주황) · 시간초과(빨강) 숫자에만, 0 이면 회색**(분석 §1-3) — 0건에 빨강이 서 있으면 문제가 있는 것처럼 읽힌다.
 * 🔴 **조회 중 · 실패에 0 을 그리지 않는다**(`spec 068`) — 0 은 "오늘 문제 없음" 으로 읽힌다.
 * `진행 중` 은 진행 중 목록의 개수다 — 목록을 받기 전이면 `-`.
 * 누를 수 없다(067 결정 유지).
 */

interface Cell {
  label: string
  value: number | null
  /** 0 이 아닐 때 숫자 색 */
  tone?: 'warning' | 'danger'
}

interface DashboardKpiCardProps {
  summary: TodaySummary | undefined
  /** 진행 중 회차 수 — 목록을 받기 전 · 실패면 `null` */
  activeCount: number | null
  /** 오늘 끝난 회차의 미인증 지점 수 — 최근 회차를 받기 전 · 실패면 `null` */
  missedCount: number | null
  state: AreaState
  onRetry: () => void
}

const DashboardKpiCard = ({ summary, activeCount, missedCount, state, onRetry }: DashboardKpiCardProps) => {
  if (state === 'error') return <KpiError onRetry={onRetry} />
  if (state === 'loading' || !summary) {
    return <div className="h-[92px] animate-pulse rounded-lg bg-muted" aria-label="불러오는 중" />
  }

  const cells: Cell[] = [
    { label: '진행 중', value: activeCount },
    { label: '완료', value: summary.completedCount + summary.incompleteCount },
    { label: '미인증 지점', value: missedCount, tone: 'warning' },
    { label: '시간초과', value: summary.overtimeCount, tone: 'danger' },
  ]

  return (
    <section aria-label="오늘 순찰" className="rounded-lg border border-border bg-card">
      <dl className="grid grid-cols-4 divide-x divide-border">
        {cells.map((cell) => (
          <div key={cell.label} className="flex min-w-0 flex-col gap-1 px-3 py-4 sm:px-5">
            <dt className="truncate text-caption font-semibold text-foreground/80">{cell.label}</dt>
            <dd className="flex items-baseline gap-1">
              <span
                className={cn(
                  'text-xl font-bold tabular-nums sm:text-[28px] sm:leading-9',
                  cell.value === null || cell.value === 0
                    ? 'text-muted-foreground'
                    : cell.tone === 'danger'
                      ? 'text-danger-foreground'
                      : cell.tone === 'warning'
                        ? 'text-warning-foreground'
                        : 'text-foreground'
                )}
              >
                {cell.value ?? '-'}
              </span>
              <span className="text-caption font-medium text-muted-foreground">건</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** 숫자 영역 오류 — 한 줄로(카드 높이를 크게 바꾸지 않는다) */
const KpiError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3">
    <CircleAlertIcon size={16} className="shrink-0 text-muted-foreground" />
    <p className="min-w-0 flex-1 text-caption text-muted-foreground">오늘 숫자를 불러오지 못했습니다</p>
    <AppButton variant="sub" onClick={onRetry}>
      다시 시도
    </AppButton>
  </div>
)

export default DashboardKpiCard
