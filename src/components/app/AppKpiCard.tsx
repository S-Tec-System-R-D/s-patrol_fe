import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * 상세 화면 상단의 **요약 칸(KPI)** — 코스 4칸 · 지점 3칸 · 배치 3칸 공용 (`spec 031`).
 *
 * 🔴 **031 에서 두 벌을 한 벌로 합쳤다.** 코스는 이 컴포넌트를, 지점은 `PointStats` 안의
 * 로컬 `Stat` 을 쓰고 있어 **같은 자리가 화면마다 다르게** 보였다.
 *
 * 🔴 **"유치해 보인다" 의 주범 세 가지를 고쳤다**(사용자 평가 2026-10-13):
 * ① 좌측 **원형** 컬러 아이콘 → **우상단 라운드 사각**, ② `size-10` → `size-8`,
 * ③ 칸마다 다른 4종 tone → **중립 기본**(색은 근거 있는 칸에만). 색이 칸마다 다르면
 * 네 칸이 서로 경쟁해서 **무엇이 중요한지** 가 사라진다.
 *
 * 🔴 **목업의 "바" 와 "증감 뱃지" 를 모든 칸에 넣지 않는다.** 칸별로 따져 보니 바를 그릴
 * 근거가 있는 곳은 **인증률 하나**고, 증감은 **0칸**이다(이전 구간 집계가 필요한데 서버
 * 요청이 는다 — OQ-031-A). 없는 기준값을 지어내는 것보다 **비워 두는 쪽**이 낫다(A1).
 *
 * ⚠️ **어휘의 기준점이다** — `spec 034`(목록 카드 시각 정합)가 여기 쓰인 토큰을 따라간다.
 * 새 토큰을 만들지 않았다(전부 `index.css` 에 있던 것).
 */

type AppKpiCardTone = 'neutral' | 'warning' | 'danger'

const toneStyles: Record<AppKpiCardTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  warning: 'bg-warning-bg text-warning-foreground',
  danger: 'bg-danger-bg text-danger-foreground',
}

interface AppKpiCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  unit?: string
  /**
   * 0~1. 주면 값 아래에 **바**를 그린다.
   *
   * 🔴 **`null`·미지정이면 바가 없다.** `0%` 바를 그리면 "0점" 으로 읽히는데, 비율을
   * 만들 수 없는 상태(분모 0·이력 없음)와 **진짜 0%** 는 다른 사실이다.
   * 🔴 **채움도 중립색**이다 — 인증률에 색을 못 쓰는 이유(`순찰제외` 때문에 분모를
   * 확신할 수 없다, `spec 023`)가 바에도 그대로 적용된다. 색을 넣으면 "빨간 바 = 문제"
   * 로 읽힌다.
   */
  ratio?: number | null
  /**
   * 값 아래 **보조 한 줄** — "무엇을 센 값인지" 만 적는다(`최근 14일 기준`,
   * `전체 인증 13 / 21건`). 🔴 `양호`·`개선 필요` 같은 **평가어를 쓰지 않는다**.
   */
  hint?: string
  /** 🔴 **기본은 중립.** 색은 근거가 있는 칸에만 — 지금은 미인증 지점 하나다 */
  tone?: AppKpiCardTone
  /**
   * 값이 숫자가 아닐 때(`10.13 09:07` 같은 시각) **한 단계 작게** 쓴다 —
   * 날짜가 숫자 자리에 들어가면 줄바꿈된다.
   */
  compactValue?: boolean
}

const AppKpiCard = ({
  icon: Icon,
  label,
  value,
  unit,
  ratio,
  hint,
  tone = 'neutral',
  compactValue = false,
}: AppKpiCardProps) => {
  const showBar = typeof ratio === 'number' && Number.isFinite(ratio)

  return (
    /* 🔴 **높이를 맞춘다**(`h-full`). 라벨이 2줄인 칸이 섞이면 4칸이 들쭉날쭉해지고,
       그 자체가 정돈되지 않은 인상을 준다 */
    <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption text-muted-foreground">{label}</p>
        {/* 🔴 우상단 **라운드 사각**. 원형 컬러 뱃지가 "유치해 보인다" 의 주범이었다 */}
        <span
          className={cn('grid size-8 shrink-0 place-items-center rounded-md', toneStyles[tone])}
        >
          <Icon size={15} strokeWidth={1.75} />
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-baseline gap-1">
          <span
            className={cn(
              'font-bold text-foreground tabular-nums',
              compactValue ? 'text-panel-title' : 'text-xl'
            )}
          >
            {value}
          </span>
          {unit && <span className="text-caption font-medium text-muted-foreground">{unit}</span>}
        </p>

        {showBar && (
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            <div
              className="h-full rounded-full bg-muted-foreground/40"
              style={{ width: `${Math.min(Math.max(ratio, 0), 1) * 100}%` }}
            />
          </div>
        )}

        {hint && <p className="text-label text-muted-foreground/80">{hint}</p>}
      </div>
    </div>
  )
}

export default AppKpiCard
