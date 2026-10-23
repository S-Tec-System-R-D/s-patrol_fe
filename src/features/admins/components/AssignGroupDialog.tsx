import { useState } from 'react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import type { GroupNode } from '@/features/auth/types/site'
import { walkGroups } from '@/features/groups/lib/groupTree'
import { groupChoices } from '../lib/adminList'
import GroupPicker from './GroupPicker'

/**
 * 담당 그룹 추가 (`spec 045` T831 → 후속) — 목업 `AssignSiteModal` 을 사업장 → **그룹** 으로(할당은 그룹 단위 — 결정 2).
 *
 * - 고르기는 `GroupPicker`(검색 · 칩 · 본부 = 지사 전부 · 지사 = 한 본부 안 — 사용자 결정 2026-10-23, 추가 폼과 같은 규칙).
 * - 🔴 **이미 맡은 그룹은 체크 · 잠금**으로 보이고 규칙 계산에 들어간다(`fixed`) — 빼지 않는다.
 * - 🔴 성공해야 닫힌다(실패 시 유지 — 호출부가 `onOpenChange(false)` 를 성공에서만 부른다).
 */

interface AssignGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  root: GroupNode
  adminName: string
  assigned: GroupNode[]
  pending: boolean
  onSubmit: (groups: GroupNode[]) => void
}

const AssignGroupDialog = ({ open, onOpenChange, ...rest }: AssignGroupDialogProps) => (
  <AppDialog
    title="담당 그룹 추가"
    description={`${rest.adminName} 관리자가 맡을 그룹을 선택합니다.`}
    open={open}
    onOpenChange={onOpenChange}
    contentClassName="sm:max-w-[520px]"
  >
    {/* 닫히면 본문이 언마운트되어 선택이 초기화된다 */}
    <AssignGroupBody {...rest} onCancel={() => onOpenChange(false)} />
  </AppDialog>
)

const AssignGroupBody = ({
  root,
  assigned,
  pending,
  onSubmit,
  onCancel,
}: Omit<AssignGroupDialogProps, 'open' | 'onOpenChange' | 'adminName'> & { onCancel: () => void }) => {
  const [selected, setSelected] = useState<number[]>([])
  const fixed = assigned.map((group) => group.groupSeq)

  return (
    <div className="flex flex-col gap-4">
      <GroupPicker
        root={root}
        options={groupChoices(root)}
        selected={selected}
        onChange={setSelected}
        fixed={fixed}
        disabled={pending}
      />
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton
          type="button"
          disabled={selected.length === 0 || pending}
          // 트리 순서로 보낸다(선택 순서가 아니라)
          onClick={() => onSubmit(walkGroups(root).filter((group) => selected.includes(group.groupSeq)))}
        >
          {selected.length > 0 ? `추가 (${selected.length})` : '추가'}
        </AppButton>
      </div>
    </div>
  )
}

export default AssignGroupDialog
