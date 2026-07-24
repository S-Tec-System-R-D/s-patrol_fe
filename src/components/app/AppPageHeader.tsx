import type { ReactNode } from 'react'

interface AppPageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

const AppPageHeader = ({ title, subtitle, action }: AppPageHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-page-title font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-caption text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default AppPageHeader
