import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface AppDetailCardProps {
  icon?: LucideIcon
  title: string
  badge?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/**
 * 마스터-디테일 우측 상세 패널 표준 컨테이너 (patterns.md §1, §11).
 * 정보행은 children 안에서 AppDetailRow로 조립한다.
 */
const AppDetailCard = ({ icon: Icon, title, badge, footer, children }: AppDetailCardProps) => {
  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-panel-title font-bold text-foreground">
          {Icon && <Icon size={16} strokeWidth={1.75} />}
          <span>{title}</span>
        </div>
        {badge}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">{children}</div>

      {footer && <div className="flex flex-col gap-2 border-t border-border pt-4">{footer}</div>}
    </div>
  )
}

export default AppDetailCard
