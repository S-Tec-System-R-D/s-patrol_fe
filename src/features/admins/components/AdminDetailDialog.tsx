import { useState } from 'react'
import { KeyRoundIcon, LockIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppDialog from '@/components/app/AppDialog'
import AppIconButton from '@/components/app/AppIconButton'
import { useMe } from '@/features/auth/hooks/useMe'
import type { GroupNode } from '@/features/auth/types/site'
import { useUserDetail } from '@/features/workers/hooks/useUserDetail'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { useAddAdminGroups, useRemoveAdminGroup } from '../hooks/useAdminGroupMutations'
import { adminGroupLabel, isTopGroup, type AdminRow } from '../lib/adminList'
import { adminRoleLabel, adminRoleVariant, isSystemAdmin } from '../lib/adminRole'
import AssignGroupDialog from './AssignGroupDialog'
import LockedAccountButton from './LockedAccountButton'

/**
 * 관리자 상세 모달 (`spec 045` US2 · US4) — 목업 `ManagerModal`(680px). 옛 계획의 마스터-디테일 패널은 폐기(결정 3).
 *
 * - 기본 정보는 `UserDetail`(사번 · 연락처). 🔴 목록 행에 없다(B-61). 실패해도 **이 칸만** 실패로 그린다 — 담당 그룹은 목록 데이터다.
 * - 목업의 소속 그룹 · 상태 · 등록일 · [활성화] 는 **없다**(사용자 결정 2026-10-23).
 * - 🔴 할당 조작은 **시스템관리자 · Master 만** — Manager 의 `UpdateGroup` 은 403 이다(실측). 회사(루트) 행은 [해제] 가 없다(OQ-045-A).
 * - 🔴 Master 가 **자기 자신**을 해제하면 그 그룹 권한을 잃는다(트리에서 사라진다 — 실측) → 확인을 받는다.
 */

interface AdminDetailDialogProps {
  /** `null` 이면 닫힘 */
  row: AdminRow | null
  root: GroupNode
  onClose: () => void
}

const AdminDetailDialog = ({ row, root, onClose }: AdminDetailDialogProps) => (
  <AppDialog
    title={row?.admin.userName ?? ''}
    open={row !== null}
    onOpenChange={(open) => !open && onClose()}
    contentClassName="sm:max-w-[680px]"
  >
    {row && <AdminDetailBody row={row} root={root} onClose={onClose} />}
  </AppDialog>
)

const AdminDetailBody = ({ row, root, onClose }: { row: AdminRow; root: GroupNode; onClose: () => void }) => {
  const { admin, groups } = row
  const detail = useUserDetail(admin.userSeq)
  const me = useMe().data
  const canAssign = me?.role === 'SYSTEM' || me?.role === 'MASTER'
  /** 🔴 범위가 할당으로 정해지는 것은 Master 뿐이다(실측) — 시스템관리자 본인은 확인하지 않는다 */
  const confirmSelf = me?.role === 'MASTER' && me.userSeq === admin.userSeq
  const system = isSystemAdmin(admin.codeSeq)

  const addGroups = useAddAdminGroups()
  const removeGroup = useRemoveAdminGroup()
  const [assignOpen, setAssignOpen] = useState(false)
  const [selfRemoval, setSelfRemoval] = useState<GroupNode | null>(null)

  const remove = (group: GroupNode) => removeGroup.mutate({ userSeq: admin.userSeq, group })
  const removingSeq = removeGroup.isPending ? removeGroup.variables?.group.groupSeq : undefined

  return (
    <div className="flex flex-col gap-5">
      <AppBadge variant={adminRoleVariant(admin.codeSeq)}>{adminRoleLabel(admin.codeSeq, admin.codeName)}</AppBadge>

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-label="기본 정보" className="flex flex-col gap-2">
          <h3 className="text-meta font-semibold text-muted-foreground">기본 정보</h3>
          {detail.isError ? (
            <div className="text-caption text-muted-foreground">
              정보를 불러오지 못했습니다.{' '}
              <button
                type="button"
                onClick={() => void detail.refetch()}
                className="font-semibold text-point-foreground underline"
              >
                다시 시도
              </button>
            </div>
          ) : detail.isPending ? (
            <div aria-label="기본 정보 불러오는 중" className="h-14 animate-pulse rounded-md bg-muted" />
          ) : (
            <>
              <AppDetailRow label="사번" value={detail.data.loginId} />
              <AppDetailRow label="연락처" value={formatPhone(detail.data.phone)} />
            </>
          )}
        </section>

        <section aria-label="담당 그룹" className="flex flex-col gap-2">
          <h3 className="text-meta font-semibold text-muted-foreground">
            담당 그룹 <span className="tabular-nums">{groups.length}</span>
          </h3>
          {groups.length === 0 ? (
            <p className="py-1.5 text-caption text-muted-foreground">지정된 담당 그룹이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {groups.map((group) => (
                <li
                  key={group.groupSeq}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <span className="text-body">{adminGroupLabel(root, group)}</span>
                  {canAssign && !isTopGroup(group) && (
                    <AppIconButton
                      icon={XIcon}
                      aria-label={`${group.groupName} 해제`}
                      title="해제"
                      disabled={removingSeq === group.groupSeq}
                      onClick={() => (confirmSelf ? setSelfRemoval(group) : remove(group))}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {canAssign && (
            <AppButton variant="dash" size="full" icon={PlusIcon} iconSize={13} onClick={() => setAssignOpen(true)}>
              그룹 추가
            </AppButton>
          )}
        </section>
      </div>

      {system ? (
        <>
          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-caption text-muted-foreground">
            <LockIcon className="mt-0.5 size-3.5 shrink-0" />
            시스템관리자는 시스템 구축 시 생성된 계정으로 수정·삭제할 수 없습니다. 담당 그룹은 변경할 수 있습니다.
          </p>
          <div className="flex justify-end">
            <AppButton onClick={onClose}>닫기</AppButton>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <LockedAccountButton icon={Trash2Icon} label="삭제" variant="destructive" className="mr-auto" />
          <LockedAccountButton icon={KeyRoundIcon} label="비밀번호" />
          <LockedAccountButton icon={PencilIcon} label="수정" variant="default" />
        </div>
      )}

      {canAssign && (
        <AssignGroupDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          root={root}
          adminName={admin.userName}
          assigned={groups}
          pending={addGroups.isPending}
          onSubmit={(picked) =>
            addGroups.mutate({ userSeq: admin.userSeq, groups: picked }, { onSuccess: () => setAssignOpen(false) })
          }
        />
      )}

      <AppAlertDialog
        size="sm"
        title="담당 그룹 해제"
        description={
          selfRemoval ? `'${selfRemoval.groupName}' 에서 해제하면 이 그룹을 더 이상 관리할 수 없습니다.` : undefined
        }
        actionLabel="해제"
        open={selfRemoval !== null}
        onOpenChange={(open) => !open && setSelfRemoval(null)}
        onAction={() => {
          if (selfRemoval) remove(selfRemoval)
          setSelfRemoval(null)
        }}
      />
    </div>
  )
}

export default AdminDetailDialog
