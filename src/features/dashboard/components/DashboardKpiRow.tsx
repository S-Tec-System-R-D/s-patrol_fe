import { CircleAlertIcon, CircleCheckIcon, ClockAlertIcon, UserRoundCogIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'

import type { DashboardKpi } from '../types'

/**
 * 오늘 숫자 4칸 — `spec 067`.
 *
 * 🔴 **`진행 중` 칸이 없다** — 바로 아래 섹션 제목의 개수와 같은 값이라 두 번 말하게 된다.
 * 🔴 **값이 0 이면 색을 빼고(`neutral`)** — 0건에 빨강이 서 있으면 문제가 있는 것처럼 읽힌다.
 * 🔴 시간초과는 `danger` 다 — 순찰이력 결과 뱃지와 같은 색(`historyBadge.ts` `overtimeBadge`).
 * 🔴 **누를 수 없다**(사용자 결정 2026-10-30) — 숫자를 보는 칸이고, 목록으로 가는 길은 메뉴에 있다.
 */

interface DashboardKpiRowProps {
  kpi: DashboardKpi
}

const toneWhen = <T extends 'point' | 'danger'>(value: number, tone: T): T | 'neutral' =>
  value > 0 ? tone : 'neutral'

const DashboardKpiRow = ({ kpi }: DashboardKpiRowProps) => {
  const cells = [
    {
      label: '오늘 완료',
      value: kpi.completedToday,
      icon: CircleCheckIcon,
      tone: 'neutral' as const,
    },
    {
      label: '오늘 미완료',
      value: kpi.incompleteToday,
      icon: CircleAlertIcon,
      tone: toneWhen(kpi.incompleteToday, 'danger'),
    },
    {
      label: '시간초과',
      value: kpi.overtimeToday,
      icon: ClockAlertIcon,
      tone: toneWhen(kpi.overtimeToday, 'danger'),
    },
    {
      label: '배치 대기',
      value: kpi.pendingDeployments,
      icon: UserRoundCogIcon,
      tone: toneWhen(kpi.pendingDeployments, 'point'),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cells.map((cell) => (
        <AppKpiCard
          key={cell.label}
          inline
          icon={cell.icon}
          label={cell.label}
          value={cell.value}
          unit="건"
          tone={cell.tone}
        />
      ))}
    </div>
  )
}

export default DashboardKpiRow
