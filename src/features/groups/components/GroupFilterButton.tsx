import { ChevronDownIcon, NetworkIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

import type { GroupNode } from '@/features/auth/types/site'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useGroupParam } from '../hooks/useGroupParam'
import { useGroupTree } from '../hooks/useGroupTree'
import { groupPath } from '../lib/groupTree'
import { GroupTree } from './GroupTree'
import { GroupTreeHeader, GroupTreeStatus } from './GroupFilterPanel'

interface GroupFilterButtonProps {
  unitLabel: string
  count?: (group: GroupNode) => number | null
  countUnit?: string
  headerAction?: ReactNode
}

/** Tailwind `xl` 과 같은 기준 — 목업의 XL(1280px) */
const XL_QUERY = '(min-width: 1280px)'

/**
 * XL 미만 관리그룹 선택 (`spec 043` T750, 목업 `GroupFilterButton`) — 경로 버튼 → 좌측 시트에 같은 트리.
 *
 * - 경로는 루트를 빼고 `본부 › 지사`, 마지막만 굵게(루트를 고르면 루트 이름).
 * - 고르면 닫힌다. 🔴 **열린 채로 XL 이상으로 넓어지면 닫는다** — 버튼은 CSS 로 숨지만 시트는 포털이라 남는다.
 */
export const GroupFilterButton = ({ unitLabel, count, countUnit, headerAction }: GroupFilterButtonProps) => {
  const tree = useGroupTree()
  const { selected, selectGroup } = useGroupParam(tree.data)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(XL_QUERY)
    const close = () => query.matches && setOpen(false)
    query.addEventListener('change', close)
    return () => query.removeEventListener('change', close)
  }, [open])

  const path = tree.data && selected ? groupPath(tree.data, selected.groupSeq) : []
  const shown = path.length > 1 ? path.slice(1) : path
  const last = shown.at(-1)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="관리그룹 선택"
        className="h-[30px] max-w-full min-w-0 inline-flex items-center gap-[7px] px-2.5 rounded-md border border-border bg-card text-body font-semibold text-foreground"
      >
        <NetworkIcon size={14} className="shrink-0 text-muted-foreground" />
        <span className="truncate">
          {shown.slice(0, -1).map((g) => (
            <span key={g.groupSeq} className="font-medium text-muted-foreground">
              {g.groupName} ›{' '}
            </span>
          ))}
          {last?.groupName ?? '관리그룹'}
        </span>
        <ChevronDownIcon size={13} className="shrink-0 text-muted-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* 폭은 목업 320px — 기본 `data-[side=left]:w-3/4` 를 같은 선택자로 덮는다 */}
        <SheetContent side="left" className="data-[side=left]:w-80 gap-0 p-0 pt-4">
          <SheetTitle className="px-4 pb-3 text-section-title">관리그룹 선택</SheetTitle>
          <SheetDescription className="sr-only">범위로 볼 관리그룹을 고릅니다.</SheetDescription>
          <div className="flex-1 overflow-y-auto border-t border-border">
            <GroupTreeHeader unitLabel={unitLabel} headerAction={headerAction} />
            {tree.data ? (
              <GroupTree
                large
                root={tree.data}
                selectedSeq={selected?.groupSeq}
                count={count}
                countUnit={countUnit}
                onSelect={(groupSeq) => {
                  selectGroup(groupSeq)
                  setOpen(false)
                }}
              />
            ) : (
              <GroupTreeStatus isError={tree.isError} onRetry={() => tree.refetch()} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
