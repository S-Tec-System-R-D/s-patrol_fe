import type { LucideIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'

type AlertDialogVariant = 'default' | 'destructive'
type AlertDialogSize = 'default' | 'sm'

const variantColorStyles: Record<AlertDialogVariant, string> = {
  default: 'bg-primary text-primary-foreground ',
  destructive: 'bg-danger-bg text-danger',
}

interface AppAlertDialogProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: React.ReactNode
  size?: AlertDialogSize

  variant?: AlertDialogVariant

  cancelLabel?: string
  actionLabel?: string
  onAction: () => void
  open?: boolean // 추가
  onOpenChange?: (open: boolean) => void // 추가
}

const AppAlertDialog = ({
  icon: Icon,
  title,
  description,
  size = 'default',
  variant = 'default',
  cancelLabel = '취소',
  actionLabel = '확인',
  onAction,
  open,
  onOpenChange,
  children,
}: AppAlertDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          {Icon && (
            <AlertDialogMedia className={`${variantColorStyles[variant]}`}>
              <Icon size={'28'} strokeWidth={1.5} />
            </AlertDialogMedia>
          )}

          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={variant} className={`cursor-pointer`} onClick={onAction}>
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AppAlertDialog
