import { BuildingIcon, EllipsisVerticalIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppIconButton from '@/components/app/AppIconButton'
import AppLinkButton from '@/components/app/AppLinkButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { GroupNode } from '@/features/auth/types/site'
import { cn } from '@/lib/utils'
import GroupNameForm from '../form/GroupNameForm'
import { useAddGroup, useDeleteGroup, useRenameGroup } from '../hooks/useGroupMutations'
import { useGroupParam } from '../hooks/useGroupParam'
import { useGroupTree } from '../hooks/useGroupTree'
import { branchSiteCount, countSites, descendantGroups, layerName } from '../lib/groupTree'
import { GroupTreeStatus } from './GroupFilterPanel'

type SubDialog = { kind: 'add' | 'rename' | 'delete'; group: GroupNode } | null

/**
 * 관리그룹 편집 모달 (`spec 043` T754 · T756 → 후속 T772, 참고 `ui-mock/본사관리자/사업장/관리그룹-편집모달1·2.png`).
 *
 * 🔴 **구조가 곧 단계다**(사용자 결정 2026-10-22) — 회사는 머리 줄(`+ 본부 추가`), **본부마다 카드 1개**, 그 안에 지사.
 * 단계 표시(T774, 목록 트리와 같은 기호) — 본부 카드 머리는 **본부 아이콘**, 지사 행은 **네모 닷**(행 사이 간격, 배경 없음 T775). 단계 이름은 회색 작은 글씨(목업).
 * - 하위 추가는 각 단계의 `+ 본부 추가` / `+ 지사 추가` — 🔴 지사 아래로는 없다(서버는 깊이를 막지 않는다, B-49).
 * - 회사(루트)는 이름 변경·삭제가 없다. 본부·지사의 이름 변경·삭제는 행 끝 ⋮ 메뉴 안에(052 — 행마다 아이콘 2개가 반복돼 시끄러웠다).
 * - 사업장 개수는 **지사 행에만**(사업장은 지사 아래에만 놓인다). "관리자 M명" 은 없다(결정 (a)).
 * - 🔴 삭제는 **하위 그룹과 소속 사업장까지** 지운다(B-51) — 확인 문구에 그 수를 쓴다.
 * - ⚠️ 규칙을 어긴 4단계 이상 그룹(서버가 막지 않아 생길 수 있다)은 이 구조에 자리가 없어 그리지 않는다 — 실데이터에는 없다.
 */
export const GroupEditDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const tree = useGroupTree()
  const { selected, clearGroup } = useGroupParam(tree.data)
  const [sub, setSub] = useState<SubDialog>(null)
  const closeSub = () => setSub(null)

  const addGroup = useAddGroup()
  const renameGroup = useRenameGroup()
  const deleteGroup = useDeleteGroup()

  const handleDelete = (group: GroupNode) => {
    const removed = [group, ...descendantGroups(group)].map((g) => g.groupSeq)
    deleteGroup.mutate(group, {
      onSuccess: () => {
        // 선택 중이던 그룹(또는 그 조상)을 지웠으면 URL 에서 걷는다 → 루트로
        if (selected && removed.includes(selected.groupSeq)) clearGroup()
      },
    })
  }

  const nameWithLayer = (group: GroupNode, className: string) => (
    <span className="flex items-baseline gap-1.5 min-w-0">
      <span className={cn('truncate', className)}>{group.groupName}</span>
      <span className="text-meta text-muted-foreground shrink-0">{layerName(group.layer)}</span>
    </span>
  )

  // modal={false} — 메뉴 항목에서 바로 삭제 확인(AlertDialog)을 열 때 body 의 pointer-events: none 이 남는 Radix 문제 회피
  const editActions = (group: GroupNode) => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <AppIconButton
          icon={EllipsisVerticalIcon}
          iconSize={14}
          aria-label={`${group.groupName} 메뉴`}
          className="shrink-0 border-0 p-1.5"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuItem className="cursor-pointer" onSelect={() => setSub({ kind: 'rename', group })}>
          <PencilIcon />
          이름 변경
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onSelect={() => setSub({ kind: 'delete', group })}
        >
          <Trash2Icon />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const addLink = (parent: GroupNode, label: string) => (
    <AppLinkButton
      icon={PlusIcon}
      aria-label={`${parent.groupName} 하위 그룹 추가`}
      onClick={() => setSub({ kind: 'add', group: parent })}
    >
      {label}
    </AppLinkButton>
  )

  /** 지사 행 — 네모 닷(목록 트리와 같다) */
  const renderBranch = (branch: GroupNode) => {
    const count = branchSiteCount(branch)
    return (
      <li key={branch.groupSeq} className="flex items-center gap-2.5 h-10 pl-3 pr-1.5">
        <span data-testid="branch-dot" aria-hidden className="size-1.5 shrink-0 rounded-[1px] bg-point" />
        <span className="flex-1 min-w-0">{nameWithLayer(branch, 'text-body font-medium')}</span>
        {count !== null && (
          <span className="text-meta text-muted-foreground whitespace-nowrap">사업장 {count}개</span>
        )}
        {editActions(branch)}
      </li>
    )
  }

  /** 본부 카드 — 머리 본부 아이콘 + 지사 목록 + `+ 지사 추가` */
  const renderHq = (hq: GroupNode) => (
    <li key={hq.groupSeq} className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 h-11 pl-3 pr-2">
        <BuildingIcon data-testid="hq-icon" aria-hidden size={16} className="shrink-0 text-point" />
        <span className="flex-1 min-w-0">{nameWithLayer(hq, 'text-tab font-semibold')}</span>
        {editActions(hq)}
      </div>
      <div className="px-3">
        {hq.children.length > 0 ? (
          <ul aria-label={`${hq.groupName} 지사`} className="flex flex-col gap-1">
            {hq.children.map(renderBranch)}
          </ul>
        ) : (
          <p className="px-3 py-2.5 text-meta text-muted-foreground">
            지사가 없습니다
          </p>
        )}
      </div>
      <div className="px-2 py-1.5">{addLink(hq, '지사 추가')}</div>
    </li>
  )

  const deleteTarget = sub?.kind === 'delete' ? sub.group : null
  const deleteDescription = (() => {
    if (!deleteTarget) return ''
    const kids = descendantGroups(deleteTarget).length
    const sites = countSites(deleteTarget)
    // 대상은 제목이 말한다(질문형, 046 #16) — 설명은 영향만
    const cascade =
      kids > 0 || sites > 0
        ? `${[kids > 0 && `하위 그룹 ${kids}개`, sites > 0 && `소속 사업장 ${sites}개`].filter(Boolean).join('와 ')}도 함께 삭제됩니다. `
        : ''
    return `${cascade}삭제된 데이터는 복구할 수 없습니다.`
  })()

  const nameTarget = sub && sub.kind !== 'delete' ? sub : null

  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={onOpenChange}
        title="관리그룹 편집"
        description="그룹은 회사 › 본부 › 지사 3단계까지 만들 수 있습니다."
        contentClassName="sm:max-w-[600px]"
      >
        <div className="flex flex-col gap-4 min-h-0">
          <div className="min-h-0 overflow-y-auto">
            {tree.data ? (
              <div className="flex flex-col gap-2.5">
                {/* 회사 머리 줄 — 이름 변경·삭제 없음 */}
                <div className="flex items-center justify-between gap-3 px-1">
                  {nameWithLayer(tree.data, 'text-section-title font-bold')}
                  {addLink(tree.data, '본부 추가')}
                </div>
                {tree.data.children.length > 0 ? (
                  <ul aria-label="관리그룹 목록" className="flex flex-col gap-2.5">
                    {tree.data.children.map(renderHq)}
                  </ul>
                ) : (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-meta text-muted-foreground">
                    본부가 없습니다. 본부를 먼저 추가해주세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="pt-3">
                <GroupTreeStatus isError={tree.isError} onRetry={() => tree.refetch()} />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <AppButton onClick={() => onOpenChange(false)}>완료</AppButton>
          </div>
        </div>
      </AppDialog>

      {nameTarget && (
        <AppDialog
          open
          onOpenChange={(next) => !next && closeSub()}
          title={nameTarget.kind === 'add' ? '하위 그룹 추가' : '그룹 이름 변경'}
          description={
            nameTarget.kind === 'add'
              ? `'${nameTarget.group.groupName}' 아래에 ${layerName(nameTarget.group.layer + 1)} 그룹을 만듭니다.`
              : `'${nameTarget.group.groupName}' 그룹의 이름을 변경합니다.`
          }
          contentClassName="sm:max-w-[400px]"
        >
          {nameTarget.kind === 'add' ? (
            <GroupNameForm
              placeholder="예) 강동지사"
              submitLabel="추가"
              pending={addGroup.isPending}
              onCancel={closeSub}
              onSubmit={(groupName) =>
                addGroup.mutate({ parent: nameTarget.group, groupName }, { onSuccess: closeSub })
              }
            />
          ) : (
            <GroupNameForm
              defaultName={nameTarget.group.groupName}
              submitLabel="저장"
              pending={renameGroup.isPending}
              onCancel={closeSub}
              onSubmit={(groupName) =>
                renameGroup.mutate(
                  { group: nameTarget.group, groupName },
                  {
                    onSuccess: closeSub,
                    // 남이 먼저 지운 그룹이면 고칠 대상이 없다 — 토스트(전역) + 트리 재조회(훅) 뒤 닫는다
                    onError: (error) =>
                      error.message === '관리그룹이 존재하지 않습니다.' && closeSub(),
                  }
                )
              }
            />
          )}
        </AppDialog>
      )}

      <AppAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => !next && closeSub()}
        size="sm"
        icon={Trash2Icon}
        variant="destructive"
        title={deleteTarget ? `'${deleteTarget.groupName}' ${layerName(deleteTarget.layer)}그룹을 삭제하시겠습니까?` : ''}
        description={deleteDescription}
        actionLabel="삭제"
        onAction={() => deleteTarget && handleDelete(deleteTarget)}
      />
    </>
  )
}
