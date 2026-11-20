import type { ReactNode } from 'react'

/**
 * 코스 상세의 **요약 칸(KPI)** — `라벨 / 값 · 단위 ··· 작은 그림`.
 *
 * 🔴 **KPI 카드는 여러 회차를 요약하는 코스 상세에만 남았다**(사용자 결정 2026-11-06) — 지점 ·
 * 회차 상세 · 배치관리는 아래 카드 · 탭과 값이 겹쳐 줄을 없앴다.
 * 새 화면에 쓰기 전에 **"이 값이 판단에 쓰이는가, 같은 화면에 또 있는가"** 를 먼저 따진다.
 *
 * 🔄 **`spec 084`: 낮은 칸**(60px · 라벨 12px · 값 18px) — 디자인 개편에서 **상자를 남기는 유일한 숫자 칸**이다.
 * 라벨 앞 아이콘은 없앴다(목업 `05-코스-상세`).
 */

interface AppKpiCardProps {
  label: string
  value: ReactNode
  /** 값 옆 작은 글자 — `시간초과 2/14` · `109/112`. 색을 입힐 때는 요소로 준다(`진행 중 · 순찰자`) */
  unit?: ReactNode
  /** 오른쪽 그림 — 화면이 자기 데이터로 그린 미니 그래프. 말풍선은 그림이 갖는다 */
  aside?: ReactNode
  /** 스크린리더 글자 — 그림이 말하는 값을 글로 남긴다(`최단 … · 최장 …`) */
  foot?: { left: string; right?: string }
}

const AppKpiCard = ({ label, value, unit, aside, foot }: AppKpiCardProps) => {
  const footText = foot && [foot.left, foot.right].filter(Boolean).join(' · ')
  return (
    <div className="flex h-full min-h-[60px] items-center gap-4 rounded-[10px] border border-border px-4 pt-2 pb-[9px]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-sub-foreground">{label}</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-[18px] leading-[1.35] font-semibold whitespace-nowrap text-foreground tabular-nums">
            {value}
          </span>
          {unit && <span className="truncate text-[12px] text-muted-foreground tabular-nums">{unit}</span>}
        </p>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
      {footText && <span className="sr-only">{footText}</span>}
    </div>
  )
}

export default AppKpiCard
