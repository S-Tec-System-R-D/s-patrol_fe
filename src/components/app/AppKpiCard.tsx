import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * 코스 상세의 **요약 칸(KPI)** — `아이콘 라벨 / 값 ··· 작은 그림`.
 *
 * 🔴 **KPI 카드는 여러 회차를 요약하는 코스 상세에만 남았다**(사용자 결정 2026-11-06) — 지점 ·
 * 회차 상세 · 배치관리는 아래 카드 · 탭과 값이 겹쳐 줄을 없앴다.
 * 새 화면에 쓰기 전에 **"이 값이 판단에 쓰이는가, 같은 화면에 또 있는가"** 를 먼저 따진다.
 *
 * ⚠️ **어휘의 기준점이다** — `spec 034`(목록 카드 시각 정합)가 여기 쓰인 토큰을 따라간다.
 */

interface AppKpiCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  unit?: string
  /** 오른쪽 그림 — 화면이 자기 데이터로 그린 미니 그래프. 말풍선은 그림이 갖는다 */
  aside?: ReactNode
  /** 스크린리더 글자 — 그림이 말하는 값을 글로 남긴다(`최단 … · 최장 …`) */
  foot?: { left: string; right?: string }
}

const AppKpiCard = ({ icon: Icon, label, value, unit, aside, foot }: AppKpiCardProps) => {
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

export default AppKpiCard
