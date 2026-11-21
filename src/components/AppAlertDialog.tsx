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
      {/* 🔄 `spec 084`(목업 `19`): 안쪽 여백 24px · 아이콘은 44px 둥근 타일 · 버튼 줄의 위 선 · 회색 바탕 없음 · 파괴 동작은 진한 빨강 */}
      <AlertDialogContent size={size} className="p-6 pt-7">
        <AlertDialogHeader>
          {Icon && (
            <AlertDialogMedia className={`size-11 rounded-full ${variantColorStyles[variant]}`}>
              <Icon size={20} strokeWidth={1.75} />
            </AlertDialogMedia>
          )}

          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] leading-[1.6]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mx-0 mb-0 rounded-none border-0 bg-transparent p-0 pt-1.5">
          <AlertDialogCancel className="h-9 cursor-pointer">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            className={`h-9 cursor-pointer ${variant === 'destructive' ? 'bg-danger! text-white! hover:bg-danger/90!' : ''}`}
            onClick={onAction}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default AppAlertDialog
