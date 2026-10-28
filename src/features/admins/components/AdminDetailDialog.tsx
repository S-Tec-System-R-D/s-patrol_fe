import { useState, type ReactElement } from 'react'
import { KeyRoundIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppDialog from '@/components/app/AppDialog'
import AppIconButton from '@/components/app/AppIconButton'
import AppLinkButton from '@/components/app/AppLinkButton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useMe } from '@/features/auth/hooks/useMe'
import type { GroupNode } from '@/features/auth/types/site'
import { formatPhone } from '@/features/workers/lib/userFormat'
import AdminPasswordForm from '../form/AdminPasswordForm'
import EditAdminForm from '../form/EditAdminForm'
import { useDeleteAdmin } from '../hooks/useAdminAccountMutations'
import { useAdminDetail } from '../hooks/useAdminDetail'
import { useAddAdminGroups, useRemoveAdminGroup } from '../hooks/useAdminGroupMutations'
import { adminGroupLabel, isTopGroup, type AdminPermission, type AdminRow } from '../lib/adminList'
import { adminRoleLabel, adminRoleVariant } from '../lib/adminRole'
import { assignmentSections } from '../lib/groupSelection'
import AssignGroupDialog from './AssignGroupDialog'
import GroupLayerMark from './GroupLayerMark'

/**
 * 관리자 상세 모달 (`spec 045` US2 · US4 → 후속 재디자인 → `spec 056` 관리자 API).
 *
 * 머리(**큰 이름** + 권한) → 기본 정보 row(사번 · 연락처, 14px) → 담당 그룹(**본부별 묶음**) → 하단 액션.
 *
 * - 🔄 아바타는 뺐다 — 관리자 사진이 사실상 없다(사용자 판단). 이름을 페이지 제목 크기로 키웠다.
 * - 연락처는 **목록 행 값** · 사번은 `GetAdminDetail`(목록에 없다). 🔴 사번 조회가 실패해도 **그 칸만** 실패로 그린다.
 * - 너비는 다른 모달과 같은 520px(사용자 요청 2026-10-28).
 * - 담당 그룹: 회사 · 본부가 할당되면 **"본부 전체" 한 줄**, 지사만이면 **본부 아래 지사 칩**(`assignmentSections`).
 *   🔄 테두리 · 구분선 없이 **행 앞 단계 아이콘**으로 구분한다(관리그룹 트리와 같은 표기 — 사용자 요청 2026-10-23).
 *   [그룹 추가] · 해제(휴지통)는 관리그룹 편집 모달과 같은 모양이다. 🔄 사업장 수는 표시하지 않는다(사용자 요청 2026-10-28).
 * - 🔴 마스터는 **전체 그룹 담당**(`allGroupYn`)이라 "전체 그룹" 한 줄 · 할당 조작 없음. 할당 조작은 **매니저에게만**,
 *   하는 사람은 시스템관리자 · Master(045 그대로). 회사(루트) 줄은 [해제] 가 없다(OQ-045-A).
 * - 🔴 매니저의 **마지막 담당 그룹은 해제할 수 없다** — 담당 그룹 필수(045)인데 서버는 `[]` 를 받는다(실측).
 * - 하단 [수정] · [비밀번호] · [삭제] 는 **권한이 있을 때만**(`adminPermission` — 페이지가 계산해 넘긴다). 본인은 [삭제] 가 없다.
 * - 목업의 소속 그룹 · 상태 · 등록일 · [활성화] 는 **없다**(사용자 결정 2026-10-23).
 */

/** 버튼 모양은 관리그룹 편집 모달(`GroupEditDialog`)과 같다 — [+ 본부 추가] 링크(`AppLinkButton`) · 휴지통 아이콘(사용자 요청 2026-10-23) */
const removeButtonClass = 'border-0 p-1.5 hover:bg-danger-bg hover:text-danger'

const LAST_GROUP_MESSAGE = '매니저는 담당 그룹이 하나 이상 있어야 합니다'

/** 마지막 그룹 해제 막음 — 🔴 disabled 버튼은 포인터 이벤트가 없어 툴팁이 안 뜬다 · 감싼 span 에 건다(044 `SiteManagersCard`) */
const LastGroupGuard = ({ locked, children }: { locked: boolean; children: ReactElement }) =>
  locked ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{LAST_GROUP_MESSAGE}</TooltipContent>
    </Tooltip>
  ) : (
    children
  )

interface AdminDetailDialogProps {
  /** `null` 이면 닫힘 */
  row: AdminRow | null
  root: GroupNode
  /** 하단 버튼 권한 — 목록 전체(내 담당 그룹)가 있어야 정해져서 페이지가 계산한다 */
  permission: AdminPermission
  onClose: () => void
}

const AdminDetailDialog = ({ row, root, permission, onClose }: AdminDetailDialogProps) => (
  <AppDialog
    title="관리자 상세"
    open={row !== null}
    onOpenChange={(open) => !open && onClose()}
    contentClassName="sm:max-w-[520px]"
  >
    {row && <AdminDetailBody row={row} root={root} permission={permission} onClose={onClose} />}
  </AppDialog>
)

const AdminDetailBody = ({
  row,
  root,
  permission,
  onClose,
}: Omit<AdminDetailDialogProps, 'row'> & { row: AdminRow }) => {
  const { admin, groups } = row
  const detail = useAdminDetail(admin.userSeq)
  const me = useMe().data
  const allGroups = admin.allGroupYn
  /** 🔴 할당 조작 = 시스템관리자 · Master 가 **매니저에게만**(마스터는 전체 담당) */
  const canAssign = (me?.role === 'SYSTEM' || me?.role === 'MASTER') && !allGroups
  const sections = assignmentSections(root, groups)
  /** 🔴 마지막 하나는 해제하지 못한다 — 매니저 담당 그룹 필수 */
  const lastGroup = groups.length <= 1

  const addGroups = useAddAdminGroups()
  const removeGroup = useRemoveAdminGroup()
  const deleteAdmin = useDeleteAdmin()
  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const onRemove = (group: GroupNode) => removeGroup.mutate({ userSeq: admin.userSeq, group })
  const removingSeq = removeGroup.isPending ? removeGroup.variables?.group.groupSeq : undefined

  return (
    <div className="flex flex-col">
      {/* 머리 + 기본 정보 */}
      <section aria-label="기본 정보" className="flex flex-col gap-3 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-page-title font-bold text-foreground">{admin.userName}</span>
          <AppBadge variant={adminRoleVariant(admin.codeSeq)}>
            {adminRoleLabel(admin.codeSeq, admin.codeName)}
          </AppBadge>
        </div>
        {/* 사번 · 연락처는 본문보다 한 단계 크게(사용자 요청 2026-10-23) */}
        <div className="flex flex-col text-section-title">
          <AppDetailRow
            variant="fixed"
            label="사번"
            value={
              detail.isError ? (
                <button
                  type="button"
                  onClick={() => void detail.refetch()}
                  className="text-caption font-semibold text-point-foreground underline"
                >
                  불러오지 못했습니다 · 다시 시도
                </button>
              ) : detail.isPending ? (
                <span
                  aria-label="불러오는 중"
                  className="inline-block h-4 w-28 animate-pulse rounded bg-muted align-middle"
                />
              ) : (
                <span className="tabular-nums">{detail.data.loginId}</span>
              )
            }
          />
          <AppDetailRow
            variant="fixed"
            label="연락처"
            value={<span className="tabular-nums">{formatPhone(admin.phone)}</span>}
          />
        </div>
      </section>

      {/* 담당 그룹 — 본부별 묶음 · 행 앞 아이콘으로 구분 */}
      <section aria-label="담당 그룹" className="flex flex-col gap-2 border-t border-border py-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-section-title font-semibold text-foreground">
            담당 그룹{' '}
            {!allGroups && (
              <span className="tabular-nums text-muted-foreground">{groups.length}</span>
            )}
          </h3>
          {canAssign && (
            <AppLinkButton icon={PlusIcon} onClick={() => setAssignOpen(true)}>
              그룹 추가
            </AppLinkButton>
          )}
        </div>
        {allGroups ? (
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <GroupLayerMark layer={0} />
            <span className="min-w-0 flex-1 truncate font-semibold">전체 그룹</span>
            <span className="rounded-sm bg-point-bg px-1.5 py-0.5 text-meta text-point-foreground">
              전체 담당
            </span>
          </div>
        ) : sections.length === 0 ? (
          <p className="py-4 text-center text-caption text-muted-foreground">
            지정된 담당 그룹이 없습니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sections.map((section) =>
              section.kind === 'whole' ? (
                <li
                  key={section.group.groupSeq}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/40"
                >
                  <GroupLayerMark layer={section.group.layer} />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {adminGroupLabel(root, section.group)}
                  </span>
                  <span className="rounded-sm bg-point-bg px-1.5 py-0.5 text-meta text-point-foreground">
                    {section.scope}
                  </span>
                  {canAssign && (
                    <span className="w-7">
                      {!isTopGroup(section.group) && (
                        <LastGroupGuard locked={lastGroup}>
                          <AppIconButton
                            icon={Trash2Icon}
                            iconSize={14}
                            aria-label={`${section.group.groupName} 해제`}
                            title={lastGroup ? undefined : '해제'}
                            className={removeButtonClass}
                            disabled={lastGroup || removingSeq === section.group.groupSeq}
                            onClick={() => onRemove(section.group)}
                          />
                        </LastGroupGuard>
                      )}
                    </span>
                  )}
                </li>
              ) : (
                <li
                  key={section.hq?.groupSeq ?? 'no-hq'}
                  className="flex flex-col gap-1.5 rounded-md px-2 py-2 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2.5">
                    <GroupLayerMark layer={section.hq ? section.hq.layer : 2} />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {section.hq ? section.hq.groupName : '지사'}
                    </span>
                    {canAssign && <span className="w-7" />}
                  </div>
                  <ul
                    aria-label={`${section.hq?.groupName ?? '지사'} 지사`}
                    className="flex flex-wrap gap-1.5 pl-6"
                  >
                    {section.branches.map((branch) => (
                      <li
                        key={branch.groupSeq}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-1 pl-2 text-caption"
                      >
                        <GroupLayerMark layer={branch.layer} />
                        {branch.groupName}
                        {canAssign && (
                          <LastGroupGuard locked={lastGroup}>
                            <button
                              type="button"
                              aria-label={`${branch.groupName} 해제`}
                              title={lastGroup ? undefined : '해제'}
                              disabled={lastGroup || removingSeq === branch.groupSeq}
                              onClick={() => onRemove(branch)}
                              className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                            >
                              <Trash2Icon className="size-3" />
                            </button>
                          </LastGroupGuard>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* 하단 액션 — 🔴 권한이 있을 때만 · 본인은 [삭제] 없음 */}
      {permission.edit && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
          {/* 삭제가 없어도 [비밀번호] · [수정] 은 오른쪽에 둔다 */}
          <div className="mr-auto">
            {permission.remove && (
              <AppAlertDialog
                size="sm"
                icon={Trash2Icon}
                variant="destructive"
                title="관리자를 삭제하시겠습니까?"
                description={`${admin.userName} 계정을 삭제합니다. 되돌릴 수 없습니다.`}
                actionLabel="삭제"
                onAction={() => deleteAdmin.mutate(admin.userSeq, { onSuccess: onClose })}
              >
                <AppButton
                  variant="destructive"
                  icon={Trash2Icon}
                  iconSize={14}
                  disabled={deleteAdmin.isPending}
                >
                  삭제
                </AppButton>
              </AppAlertDialog>
            )}
          </div>
          <AppDialog
            title="비밀번호 변경"
            description="관리자가 로그인에 쓸 새 비밀번호를 지정합니다."
            contentClassName="sm:max-w-[520px]"
            open={passwordOpen}
            onOpenChange={setPasswordOpen}
            trigger={
              <AppButton variant="sub" icon={KeyRoundIcon} iconSize={14}>
                비밀번호
              </AppButton>
            }
          >
            <AdminPasswordForm userSeq={admin.userSeq} onSuccess={() => setPasswordOpen(false)} />
          </AppDialog>
          <AppDialog
            title="관리자 수정"
            description="관리자 정보를 수정합니다."
            contentClassName="sm:max-w-[520px]"
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={
              <AppButton icon={PencilIcon} iconSize={14}>
                수정
              </AppButton>
            }
          >
            <EditAdminForm admin={admin} onSuccess={() => setEditOpen(false)} />
          </AppDialog>
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
            addGroups.mutate(
              { userSeq: admin.userSeq, groups: picked },
              { onSuccess: () => setAssignOpen(false) }
            )
          }
        />
      )}
    </div>
  )
}

export default AdminDetailDialog
