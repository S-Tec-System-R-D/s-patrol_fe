import { useState } from 'react'
import { FolderTreeIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import type { GroupNode } from '@/features/auth/types/site'
import { walkGroups } from '@/features/groups/lib/groupTree'
import { isTopGroup } from '../lib/adminList'

/**
 * 담당 그룹 추가 (`spec 045` T831) — 목업 `AssignSiteModal` 을 사업장 → **그룹** 으로(할당은 그룹 단위 — 결정 2).
 *
 * - 선택지 = 트리의 그룹(단계 들여쓰기). 🔴 **회사(루트)와 이미 맡은 그룹은 뺀다** — 루트 변경은 미실측(OQ-045-A).
 * - Master 의 트리는 자기 할당 그룹만이라(실측) 선택지도 자연히 그 안이다 — 서버도 밖은 403.
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
  const assignedSeqs = new Set(assigned.map((group) => group.groupSeq))
  const options = walkGroups(root).filter((group) => !isTopGroup(group) && !assignedSeqs.has(group.groupSeq))
  /** 들여쓰기 기준 — Master 트리는 루트가 지사일 수도 있다 */
  const baseLayer = options.length > 0 ? Math.min(...options.map((group) => group.layer)) : 0

  const toggle = (groupSeq: number) =>
    setSelected((prev) => (prev.includes(groupSeq) ? prev.filter((seq) => seq !== groupSeq) : [...prev, groupSeq]))

  return (
    <div className="flex flex-col gap-4">
      {options.length === 0 ? (
        <AppEmpty icon={FolderTreeIcon} title="추가할 수 있는 그룹이 없습니다." />
      ) : (
        <ul aria-label="그룹 선택" className="flex max-h-[360px] flex-col gap-1 overflow-y-auto">
          {options.map((group) => (
            <li key={group.groupSeq} style={{ paddingLeft: (group.layer - baseLayer) * 16 }}>
              <AppCheckbox
                label={group.groupName}
                checked={selected.includes(group.groupSeq)}
                onChange={() => toggle(group.groupSeq)}
                disabled={pending}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton
          type="button"
          disabled={selected.length === 0 || pending}
          // 트리 순서로 보낸다(선택 순서가 아니라)
          onClick={() => onSubmit(options.filter((group) => selected.includes(group.groupSeq)))}
        >
          {selected.length > 0 ? `추가 (${selected.length})` : '추가'}
        </AppButton>
      </div>
    </div>
  )
}

export default AssignGroupDialog
