import type { ReactNode } from 'react'

import type { GroupNode } from '@/features/auth/types/site'
import { useGroupParam } from '../hooks/useGroupParam'
import { useGroupTree } from '../hooks/useGroupTree'
import { GroupTree } from './GroupTree'

interface GroupFilterProps {
  /** 숫자 단위 캡션 — `사업장` · `관리자` */
  unitLabel: string
  count?: (group: GroupNode) => number | null
  /** 머리 오른쪽 — 편집 버튼(`GroupEditTrigger`) */
  headerAction?: ReactNode
}

/** 트리 로딩·실패 자리 — 패널과 시트가 같이 쓴다 */
export const GroupTreeStatus = ({ isError, onRetry }: { isError: boolean; onRetry: () => void }) =>
  isError ? (
    <div className="px-4 pb-4 text-caption text-muted-foreground">
      관리그룹을 불러오지 못했습니다.{' '}
      <button type="button" onClick={onRetry} className="font-semibold text-point-foreground underline">
        다시 시도
      </button>
    </div>
  ) : (
    <div aria-label="관리그룹 불러오는 중" className="flex flex-col gap-2 px-3 pb-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-6 rounded-md bg-muted animate-pulse" />
      ))}
    </div>
  )

export const GroupTreeHeader = ({ unitLabel, headerAction }: Omit<GroupFilterProps, 'count'>) => (
  // 제목은 카드 제목 크기(14px) — 10.5px 은 너무 작았다(사용자 지적 2026-10-22)
  <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
    <span className="flex items-baseline gap-1.5">
      <span className="text-section-title font-bold text-foreground">관리그룹</span>
      <span className="text-meta text-muted-foreground">{unitLabel} 수</span>
    </span>
    {headerAction}
  </div>
)

/**
 * XL 이상 좌측 고정 관리그룹 패널 (`spec 043` T749, 목업 `GroupFilterPanel`) — 248px 카드.
 * sticky 는 **감싸는 쪽(페이지)** 이 건다 — 자기 높이만 한 래퍼 안에서 걸면 붙지 않는다.
 * 선택은 `?group`(`useGroupParam`). 트리가 실패해도 본문은 그대로 그린다(패널만 실패 표시).
 */
export const GroupFilterPanel = ({ unitLabel, count, headerAction }: GroupFilterProps) => {
  const tree = useGroupTree()
  const { selected, selectGroup } = useGroupParam(tree.data)

  return (
    <aside className="w-[248px] rounded-lg border border-border bg-card">
      <GroupTreeHeader unitLabel={unitLabel} headerAction={headerAction} />
      {tree.data ? (
        <GroupTree
          root={tree.data}
          selectedSeq={selected?.groupSeq}
          onSelect={selectGroup}
          count={count}
        />
      ) : (
        <GroupTreeStatus isError={tree.isError} onRetry={() => tree.refetch()} />
      )}
    </aside>
  )
}
