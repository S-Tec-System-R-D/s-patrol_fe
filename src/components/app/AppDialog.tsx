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
  /** 제목 오른쪽 — 상태 뱃지 등(`spec 074` 회차 상세). 제목과 한 줄에 간격을 두고 놓는다 */
  titleSuffix?: React.ReactNode
  /** 제목 글자 크기를 바꿀 때(`spec 074` 회차 상세 `text-lg`) */
  titleClassName?: string
}

const AppDialog = ({
  title,
  description,
  trigger,
  children,
  open,
  onOpenChange,
  contentClassName,
  titleSuffix,
  titleClassName,
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
        {/* `spec 083`: 안쪽 여백 16 → 24px */}
        <DialogHeader className="px-6 pt-[22px] pb-0">
          {titleSuffix ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <DialogTitle className={titleClassName}>{title}</DialogTitle>
              {titleSuffix}
            </div>
          ) : (
            <DialogTitle className={titleClassName}>{title}</DialogTitle>
          )}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* 🔴 `overflow-y-auto` — 바깥이 `max-h-[80vh] overflow-hidden` 이라 스크롤이 없으면
            긴 폼(사업장 추가 · 근무자 추가 · 공지 수정)이 낮은 화면에서 저장 버튼째 잘린다.
            안쪽 스크롤이 있는 모달(관리그룹 편집 · 관리자 추가)은 `min-h-0` 으로 줄어 그대로 */}
        {/* 🔴 `-mt-1 pt-1` — 이 상자가 스크롤 상자라 안쪽 여백 밖은 잘린다. 위 여백이 0 이면 맨 위 입력 칸의 초점 테두리(바깥 2px)가
            위쪽만 잘려 보였다(사용자 지적 2026-11-21 — 지점 추가 창의 검색 칸). 4px 를 주고 같은 만큼 끌어올려 자리는 그대로 둔다 */}
        <div className="-mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-1 pb-6">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

export default AppDialog
