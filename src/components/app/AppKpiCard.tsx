import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * 화면 상단의 **요약 칸(KPI)** — 배치관리 4칸(기본) · 코스 상세 3칸(`compact`).
 *
 * 🔴 **세로로 쌓는 큰 카드와 값 아래 바를 없앴다**(2026-11-06) — 지점 · 회차 상세의 KPI 줄을
 * 지우면서 쓰는 곳이 사라졌다.
 *
 * ⚠️ **어휘의 기준점이다** — `spec 034`(목록 카드 시각 정합)가 여기 쓰인 토큰을 따라간다.
 */

/**
 * 아이콘 칩의 톤. 🔴 **기본은 중립**이고 `warning` 은 **근거가 있는 칸에만**(대기중인 요청).
 * 칸마다 다른 색을 주면 칸끼리 경쟁해 무엇이 중요한지가 사라진다.
 */
type AppKpiCardTone = 'neutral' | 'warning'

const toneStyles: Record<AppKpiCardTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  warning: 'bg-warning-bg text-warning-foreground',
}

interface AppKpiCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  unit?: string
  /**
   * **라벨 뒤**의 보조 문구 — "무엇을 센 값인지" 만 적는다(`배치예정 포함`).
   * 🔴 `양호`·`개선 필요` 같은 **평가어를 쓰지 않는다**. 좁으면 잘리고 `title` 로 남는다.
   * 기본 모양에서만 그린다.
   */
  hint?: string
  /** 기본 모양에서만 그린다 — `compact` 는 아이콘 칩이 없다 */
  tone?: AppKpiCardTone
  /**
   * 🔴 **가로 얇은 카드**(사용자 결정 2026-11-06, 코스 상세) — `아이콘 라벨 / 값 ··· 작은 그림`.
   * 주지 않으면 **한 줄 카드**다 — `[아이콘] 라벨 · 보조 ··· 값 단위`(`spec 039`).
   */
  compact?: boolean
  /** `compact` 오른쪽에 놓는 그림 — 화면이 자기 데이터로 그린 미니 그래프. 말풍선은 그림이 갖는다 */
  aside?: ReactNode
  /** `compact` 의 스크린리더 글자 — 그림이 말하는 값을 글로 남긴다(`최단 … · 최장 …`) */
  foot?: { left: string; right?: string }
}

const AppKpiCard = ({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  tone = 'neutral',
  compact = false,
  aside,
  foot,
}: AppKpiCardProps) => {
  if (compact) {
    const footText = foot && [foot.left, foot.right].filter(Boolean).join(' · ')
    return (
      <div className="flex h-full items-center gap-3 rounded-lg border border-border bg-card px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-caption font-medium text-foreground/80">
            <Icon size={14} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </p>
          <p className="flex items-baseline gap-1">
            <span className="text-xl font-bold whitespace-nowrap text-foreground tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="truncate text-caption font-medium text-muted-foreground">{unit}</span>
            )}
          </p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
        {footText && <span className="sr-only">{footText}</span>}
      </div>
    )
  }

  return (
    <div className="flex h-full items-center gap-2 rounded-lg border border-border bg-card px-5 py-3">
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', toneStyles[tone])}>
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <p className="min-w-0 shrink-0 text-caption font-medium text-foreground/80">{label}</p>
      {/* 보조 문구는 라벨 뒤 — 좁으면 이것부터 말줄임(라벨·값이 먼저 자리를 갖는다) */}
      {hint ? (
        <span className="min-w-0 flex-1 truncate text-label text-muted-foreground/80" title={hint}>
          {hint}
        </span>
      ) : (
        <span className="flex-1" />
      )}
      <p className="flex shrink-0 items-baseline gap-1">
        <span className="text-xl font-bold text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-caption font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  )
}

export default AppKpiCard
