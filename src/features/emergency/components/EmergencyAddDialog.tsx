import { useState } from 'react'
import {
  FolderTreeIcon,
  MapPinIcon,
  ShieldIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppInput from '@/components/app/AppInput'
import { adminRoleLabel } from '@/features/admins/lib/adminRole'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { cn } from '@/lib/utils'
import { useEmergencyTree } from '../hooks/useEmergency'
import { DAY_LABEL, pickableTree, searchTree } from '../lib/emergencyTree'
import type { EmergencyDay, EmergencyTreeNode } from '../types/emergency'

/**
 * 비상연락 담당자 추가 모달 (`spec 057` T1024) — 요일 행의 [추가] 에서 연다.
 *
 * - 후보 = `GetEmergencyUserTree`(전사 · 사업장 · 요일 무관) · 🔴 시스템관리자 제외 · 사람 없는 노드 숨김(`pickableTree`).
 * - 🔴 **그 요일에 이미 등록된 사람은 체크 · 잠금** — 후보 트리는 등록 여부를 모른다(실측).
 * - 🔴 근무자가 배치 중이면(`assignmentYn`) "배치 중 · {사업장}" 뱃지. `assignmentType` 은 무시.
 * - 같은 사람이 여러 노드에 있어도 `userSeq` 로 같이 체크된다.
 * - 🔴 성공해야 닫힌다 — 호출부가 `onOpenChange(false)` 를 성공에서만 부른다(045 `AssignGroupDialog` 와 같다).
 */

interface EmergencyAddDialogProps {
  day: EmergencyDay | null
  onOpenChange: (open: boolean) => void
  registered: Set<number>
  pending: boolean
  onSubmit: (userSeqs: number[]) => void
}

const NODE_ICON = {
  ROOT: ShieldIcon,
  GROUP: FolderTreeIcon,
  SITE: MapPinIcon,
  UNASSIGNED: UsersIcon,
} as const

const EmergencyAddDialog = ({ day, onOpenChange, ...rest }: EmergencyAddDialogProps) => (
  <AppDialog
    title={day ? `${DAY_LABEL[day]}요일 담당자 추가` : '담당자 추가'}
    description="알림 받을 담당자를 선택합니다."
    open={day !== null}
    onOpenChange={onOpenChange}
    contentClassName="sm:max-w-[520px]"
  >
    {/* 닫히면 본문이 언마운트되어 선택 · 검색이 초기화된다 */}
    {day && <EmergencyAddBody {...rest} onCancel={() => onOpenChange(false)} />}
  </AppDialog>
)

const EmergencyAddBody = ({
  registered,
  pending,
  onSubmit,
  onCancel,
}: Omit<EmergencyAddDialogProps, 'day' | 'onOpenChange'> & { onCancel: () => void }) => {
  const tree = useEmergencyTree(true)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (userSeq: number) =>
    setSelected((prev) =>
      prev.includes(userSeq) ? prev.filter((seq) => seq !== userSeq) : [...prev, userSeq]
    )

  const renderNode = (node: EmergencyTreeNode, depth: number) => {
    const Icon = NODE_ICON[node.nodeType]
    return (
      <li key={`${node.nodeType}-${node.nodeSeq ?? node.name}`} className="flex flex-col">
        <div
          className="flex items-center gap-1.5 py-1.5 text-caption font-semibold text-muted-foreground"
          style={{ paddingLeft: 8 + depth * 16 }}
        >
          <Icon className="size-3.5 shrink-0" />
          {node.name}
        </div>
        {node.members.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {node.members.map((member) => {
              const locked = registered.has(member.userSeq)
              const checked = locked || selected.includes(member.userSeq)
              return (
                <li
                  key={member.userSeq}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md py-1.5 pr-3 transition-colors',
                    checked && !locked
                      ? 'bg-point-bg'
                      : locked
                        ? 'bg-point-bg/40'
                        : 'hover:bg-muted/50'
                  )}
                  style={{ paddingLeft: 8 + (depth + 1) * 16 }}
                >
                  <AppCheckbox
                    label={
                      <span className="flex flex-wrap items-center gap-1.5">
                        <UserIcon className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold">{member.userName}</span>
                        <span className="text-meta text-muted-foreground">
                          {adminRoleLabel(member.codeSeq, member.codeName)}
                        </span>
                        {member.assignmentYn && (
                          <span className="rounded-sm bg-warning-bg px-1.5 py-0.5 text-meta text-warning-foreground">
                            배치 중{member.assignedSiteName ? ` · ${member.assignedSiteName}` : ''}
                          </span>
                        )}
                      </span>
                    }
                    aria-label={member.userName}
                    checked={checked}
                    disabled={pending || locked}
                    onChange={() => toggle(member.userSeq)}
                  />
                  <span className="text-meta tabular-nums text-muted-foreground">
                    {formatPhone(member.phone)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {node.children.length > 0 && (
          <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    )
  }

  const visible = tree.data ? searchTree(pickableTree(tree.data), keyword) : []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <AppInput
        variant="search"
        placeholder="이름 검색"
        aria-label="담당자 검색"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <div className="max-h-[320px] min-h-0 flex-1 overflow-y-auto rounded-md border border-border p-1">
        {tree.isError ? (
          <div>
            <AppEmpty icon={TriangleAlertIcon} title="담당자 후보를 불러오지 못했습니다" />
            <div className="flex justify-center pb-4">
              <AppButton variant="sub" onClick={() => void tree.refetch()}>
                다시 시도
              </AppButton>
            </div>
          </div>
        ) : tree.isPending ? (
          <div
            aria-label="담당자 후보 불러오는 중"
            className="h-40 animate-pulse rounded-md bg-muted"
          />
        ) : visible.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted-foreground">
            검색 결과가 없습니다.
          </p>
        ) : (
          <ul aria-label="담당자 후보" className="flex flex-col">
            {visible.map((node) => renderNode(node, 0))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton
          type="button"
          disabled={selected.length === 0 || pending}
          onClick={() => onSubmit(selected)}
        >
          {selected.length > 0 ? `추가 (${selected.length})` : '추가'}
        </AppButton>
      </div>
    </div>
  )
}

export default EmergencyAddDialog
