import { useState } from 'react'
import { KeyRoundIcon, LockIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppDialog from '@/components/app/AppDialog'
import AppIconButton from '@/components/app/AppIconButton'
import AppLinkButton from '@/components/app/AppLinkButton'
import { useMe } from '@/features/auth/hooks/useMe'
import type { GroupNode } from '@/features/auth/types/site'
import { useUserDetail } from '@/features/workers/hooks/useUserDetail'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { useAddAdminGroups, useRemoveAdminGroup } from '../hooks/useAdminGroupMutations'
import { adminGroupLabel, isTopGroup, type AdminRow } from '../lib/adminList'
import { adminRoleLabel, adminRoleVariant, isSystemAdmin } from '../lib/adminRole'
import { assignmentSections } from '../lib/groupSelection'
import AssignGroupDialog from './AssignGroupDialog'
import GroupLayerMark from './GroupLayerMark'
import LockedAccountButton from './LockedAccountButton'

/**
 * 관리자 상세 모달 (`spec 045` US2 · US4 → 후속 재디자인, 사용자 결정 2026-10-23).
 *
 * 머리(**큰 이름** + 권한) → 기본 정보 row(사번 · 연락처, 14px) → 담당 그룹(**본부별 묶음**) → 하단 액션.
 *
 * - 🔄 아바타는 뺐다 — 관리자 사진이 사실상 없다(사용자 판단). 이름을 페이지 제목 크기로 키웠다.
 * - 사번 · 연락처는 `UserDetail`. 🔴 목록 행에 없다(B-61). 실패해도 **그 칸만** 실패로 그린다 — 담당 그룹은 목록 데이터다.
 * - 담당 그룹: 회사 · 본부가 할당되면 **"본부 전체" 한 줄**, 지사만이면 **본부 아래 지사 칩**(`assignmentSections`).
 *   🔄 테두리 · 구분선 없이 **행 앞 단계 아이콘**으로 구분한다(관리그룹 트리와 같은 표기 — 사용자 요청 2026-10-23).
 *   [그룹 추가] · 해제(휴지통)는 관리그룹 편집 모달과 같은 모양이다.
 *   사업장 수는 트리에서 센다(요청 없음). 본부가 할당된 지사의 개별 할당은 본부 줄에 포함된다.
 * - 목업의 소속 그룹 · 상태 · 등록일 · [활성화] 는 **없다**(사용자 결정 2026-10-23).
 * - 🔴 할당 조작은 **시스템관리자 · Master 만** — Manager 의 `UpdateGroup` 은 403 이다(실측). 회사(루트) 줄은 [해제] 가 없다(OQ-045-A).
 * - 🔴 Master 가 **자기 자신**을 해제하면 그 그룹 권한을 잃는다(트리에서 사라진다 — 실측) → 확인을 받는다.
 */

/** 버튼 모양은 관리그룹 편집 모달(`GroupEditDialog`)과 같다 — [+ 본부 추가] 링크(`AppLinkButton`) · 휴지통 아이콘(사용자 요청 2026-10-23) */
const removeButtonClass = 'border-0 p-1.5 hover:bg-danger-bg hover:text-danger'

interface AdminDetailDialogProps {
  /** `null` 이면 닫힘 */
  row: AdminRow | null
  root: GroupNode
  onClose: () => void
}

const AdminDetailDialog = ({ row, root, onClose }: AdminDetailDialogProps) => (
  <AppDialog
    title="관리자 상세"
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
  const sections = assignmentSections(root, groups)

  const addGroups = useAddAdminGroups()
  const removeGroup = useRemoveAdminGroup()
  const [assignOpen, setAssignOpen] = useState(false)
  const [selfRemoval, setSelfRemoval] = useState<GroupNode | null>(null)

  const remove = (group: GroupNode) => removeGroup.mutate({ userSeq: admin.userSeq, group })
  const removingSeq = removeGroup.isPending ? removeGroup.variables?.group.groupSeq : undefined
  const onRemove = (group: GroupNode) => (confirmSelf ? setSelfRemoval(group) : remove(group))

  /** 기본 정보 값 칸 — 조회 중 · 실패를 그 칸 안에서 */
  const detailValue = (pick: (data: NonNullable<typeof detail.data>) => string) =>
    detail.isError ? (
      <span className="text-muted-foreground">불러오지 못했습니다</span>
    ) : detail.isPending ? (
      <span aria-label="불러오는 중" className="inline-block h-4 w-28 animate-pulse rounded bg-muted align-middle" />
    ) : (
      <span className="tabular-nums">{pick(detail.data)}</span>
    )

  return (
    <div className="flex flex-col">
      {/* 머리 + 기본 정보 */}
      <section aria-label="기본 정보" className="flex flex-col gap-3 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-page-title font-bold text-foreground">{admin.userName}</span>
          <AppBadge variant={adminRoleVariant(admin.codeSeq)}>{adminRoleLabel(admin.codeSeq, admin.codeName)}</AppBadge>
        </div>
        {/* 사번 · 연락처는 본문보다 한 단계 크게(사용자 요청 2026-10-23) */}
        <div className="flex flex-col text-section-title">
          <AppDetailRow variant="fixed" label="사번" value={detailValue((data) => data.loginId)} />
          <AppDetailRow variant="fixed" label="연락처" value={detailValue((data) => formatPhone(data.phone))} />
        </div>
        {detail.isError && (
          <button
            type="button"
            onClick={() => void detail.refetch()}
            className="self-start text-caption font-semibold text-point-foreground underline"
          >
            정보 다시 불러오기
          </button>
        )}
      </section>

      {/* 담당 그룹 — 본부별 묶음 · 행 앞 아이콘으로 구분 */}
      <section aria-label="담당 그룹" className="flex flex-col gap-2 border-t border-border py-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-section-title font-semibold text-foreground">
            담당 그룹 <span className="tabular-nums text-muted-foreground">{groups.length}</span>
          </h3>
          {canAssign && (
            <AppLinkButton icon={PlusIcon} onClick={() => setAssignOpen(true)}>
              그룹 추가
            </AppLinkButton>
          )}
        </div>
        {sections.length === 0 ? (
          <p className="py-4 text-center text-caption text-muted-foreground">지정된 담당 그룹이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sections.map((section) =>
              section.kind === 'whole' ? (
                <li
                  key={section.group.groupSeq}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/40"
                >
                  <GroupLayerMark layer={section.group.layer} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{adminGroupLabel(root, section.group)}</span>
                  <span className="rounded-sm bg-point-bg px-1.5 py-0.5 text-meta text-point-foreground">
                    {section.scope}
                  </span>
                  <span className="w-12 text-right text-caption tabular-nums text-muted-foreground">
                    {section.sites}개
                  </span>
                  {canAssign && (
                    <span className="w-7">
                      {!isTopGroup(section.group) && (
                        <AppIconButton
                          icon={Trash2Icon}
                          iconSize={14}
                          aria-label={`${section.group.groupName} 해제`}
                          title="해제"
                          className={removeButtonClass}
                          disabled={removingSeq === section.group.groupSeq}
                          onClick={() => onRemove(section.group)}
                        />
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
                    <span className="w-12 text-right text-caption tabular-nums text-muted-foreground">
                      {section.sites}개
                    </span>
                    {canAssign && <span className="w-7" />}
                  </div>
                  <ul aria-label={`${section.hq?.groupName ?? '지사'} 지사`} className="flex flex-wrap gap-1.5 pl-6">
                    {section.branches.map((branch) => (
                      <li
                        key={branch.groupSeq}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-1 pl-2 text-caption"
                      >
                        <GroupLayerMark layer={branch.layer} />
                        {branch.groupName}
                        {canAssign && (
                          <button
                            type="button"
                            aria-label={`${branch.groupName} 해제`}
                            title="해제"
                            disabled={removingSeq === branch.groupSeq}
                            onClick={() => onRemove(branch)}
                            className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                          >
                            <Trash2Icon className="size-3" />
                          </button>
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

      {/* 하단 액션 */}
      <div className="flex flex-col gap-3 border-t border-border pt-5">
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
      </div>

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
        title="담당 그룹을 해제하시겠습니까?"
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
