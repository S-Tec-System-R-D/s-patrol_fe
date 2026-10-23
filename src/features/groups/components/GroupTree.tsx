import { BuildingIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'

import type { GroupNode } from '@/features/auth/types/site'
import { cn } from '@/lib/utils'

/** 단계별 글자 굵기 — 회사 · 본부 · 지사 */
const LAYER_WEIGHT: Record<number, string> = { 0: 'font-bold', 1: 'font-semibold', 2: 'font-normal' }

interface GroupTreeProps {
  root: GroupNode
  selectedSeq: number | undefined
  onSelect: (groupSeq: number) => void
  /** 행 오른쪽 개수 — 화면이 정한다(사업장 화면 = `branchSiteCount`). `null` 이면 그 행은 비운다 */
  count?: (group: GroupNode) => number | null
  /** 수 뒤 단위 — 사업장 `개` · 관리자 `명`(`spec 045` 후속) */
  countUnit?: string
  /** 시트용 큰 행(44px) */
  large?: boolean
}

/**
 * 관리그룹 트리 (`spec 043` T748, 목업 `GroupTree`) — 조회·필터 전용. 편집은 `GroupEditDialog`.
 *
 * 처음엔 **전부 펼친다**(목업) — 접은 노드만 기억한다. 들여쓰기는 단계마다 18px.
 * 🔴 단계 구분(사용자 결정 2026-10-23, T774): 하위가 있는 그룹은 **펼침 화살표만**, 본부는 **본부 아이콘**,
 * 지사는 화살표 자리에 **네모 닷** + **글자 굵기**(회사 굵게 · 본부 중간 · 지사 보통). 선택은 배경·글자색으로만.
 */
export const GroupTree = ({ root, selectedSeq, onSelect, count, countUnit = '개', large }: GroupTreeProps) => {
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set())

  const toggle = (groupSeq: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(groupSeq)) next.delete(groupSeq)
      else next.add(groupSeq)
      return next
    })

  const renderNode = (group: GroupNode) => {
    const hasChildren = group.children.length > 0
    const open = !collapsed.has(group.groupSeq)
    const active = group.groupSeq === selectedSeq
    const shownCount = count?.(group) ?? null

    return (
      <li key={group.groupSeq}>
        <div
          role="treeitem"
          aria-selected={active}
          aria-expanded={hasChildren ? open : undefined}
          tabIndex={0}
          onClick={() => onSelect(group.groupSeq)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(group.groupSeq)
            }
          }}
          className={cn(
            'flex items-center gap-1 pr-2 rounded-md cursor-pointer select-none',
            large ? 'h-11 text-tab' : 'h-[34px] text-body',
            LAYER_WEIGHT[group.layer] ?? 'font-normal',
            active ? 'bg-point-bg text-point-foreground' : 'text-foreground hover:bg-muted/50'
          )}
          // 지사만 55px(사용자 지정 2026-10-23) — 네모 닷이 본부 아이콘 아래쯤 오게
          style={{ paddingLeft: group.layer === 2 ? 55 : 4 + group.layer * 18 }}
        >
          {hasChildren ? (
            <button
              type="button"
              aria-label={open ? `${group.groupName} 접기` : `${group.groupName} 펼치기`}
              onClick={(e) => {
                e.stopPropagation()
                toggle(group.groupSeq)
              }}
              className="w-[22px] h-[22px] shrink-0 grid place-items-center rounded text-muted-foreground hover:bg-muted"
            >
              <ChevronRightIcon
                size={13}
                strokeWidth={2.2}
                className={cn('transition-transform', open && 'rotate-90')}
              />
            </button>
          ) : (
            <span className="w-[22px] shrink-0 grid place-items-center">
              {group.layer === 2 && (
                <span data-testid="branch-dot" aria-hidden className="size-1.5 rounded-[1px] bg-point" />
              )}
            </span>
          )}
          {group.layer === 1 && (
            <BuildingIcon
              data-testid="hq-icon"
              aria-hidden
              size={14}
              className={cn('shrink-0', active ? 'text-point-foreground' : 'text-muted-foreground')}
            />
          )}
          <span className="flex-1 min-w-0 truncate">{group.groupName}</span>
          {/* "11" 만 쓰면 11번인지 11개인지 헷갈린다(사용자 지적 2026-10-22) — 단위를 붙인다 */}
          {shownCount !== null && (
            <span
              className={cn(
                'text-meta whitespace-nowrap',
                active ? 'text-point-foreground' : 'text-muted-foreground'
              )}
            >
              {shownCount}
              {countUnit}
            </span>
          )}
        </div>
        {hasChildren && open && <ul role="group">{group.children.map(renderNode)}</ul>}
      </li>
    )
  }

  return (
    <ul role="tree" aria-label="관리그룹" className="px-1.5 pb-2">
      {renderNode(root)}
    </ul>
  )
}
