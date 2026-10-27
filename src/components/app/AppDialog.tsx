import React from 'react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

interface AppDialogProps {
  title: string
  description?: string
  trigger?: React.ReactNode
  children: React.ReactNode
  open?: boolean // 추가
  onOpenChange?: (open: boolean) => void // 추가
  /**
   * 본문 상자 클래스 — 폭을 바꿀 때 쓴다(`spec 043`: 관리그룹 편집 600px). 기본 폭은 `sm:max-w-sm`(384px)이라
   * 🔴 **같은 반응형 접두사로 덮어야 한다**(`sm:max-w-[600px]`). 접두사 없이 `max-w-*` 만 주면 `sm` 이상에서 지워진다.
   */
  contentClassName?: string
}

const AppDialog = ({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  contentClassName,
}: AppDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogTrigger className="" asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent
        className={cn('max-h-[80vh] flex flex-col overflow-hidden p-0', contentClassName)}
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* 🔴 `overflow-y-auto` — 바깥이 `max-h-[80vh] overflow-hidden` 이라 스크롤이 없으면
            긴 폼(사업장 추가 · 근무자 추가 · 공지 수정)이 낮은 화면에서 저장 버튼째 잘린다.
            안쪽 스크롤이 있는 모달(관리그룹 편집 · 관리자 추가)은 `min-h-0` 으로 줄어 그대로 */}
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto p-4 pt-0">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export default AppDialog
