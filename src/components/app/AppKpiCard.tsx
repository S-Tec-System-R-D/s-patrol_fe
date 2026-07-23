import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type AppKpiCardTone = 'point' | 'success' | 'warning' | 'danger'

interface AppKpiCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  unit?: string
  tone?: AppKpiCardTone
}

const toneStyles: Record<AppKpiCardTone, string> = {
  point: 'bg-point-bg text-point-foreground',
  success: 'bg-success-bg text-success-foreground',
  warning: 'bg-warning-bg text-warning-foreground',
  danger: 'bg-danger-bg text-danger-foreground',
}

const AppKpiCard = ({ icon: Icon, label, value, unit, tone = 'point' }: AppKpiCardProps) => {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', toneStyles[tone])}>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
        </p>
      </div>
    </div>
  )
}

export default AppKpiCard
