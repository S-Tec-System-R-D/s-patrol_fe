import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  iconSize?: number
}

const AppIconButton = ({ icon: Icon, iconSize = 16, className, ...props }: AppIconButtonProps) => {
  return (
    <button
      className={cn(
        'p-2 rounded-sm border text-muted-foreground hover:bg-muted hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={1.5} />
    </button>
  )
}

export default AppIconButton
