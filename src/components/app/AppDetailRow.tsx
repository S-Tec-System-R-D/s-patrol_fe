import type { ReactNode } from 'react'

interface AppDetailRowProps {
  label: string
  value: ReactNode
}

const AppDetailRow = ({ label, value }: AppDetailRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  )
}

export default AppDetailRow
