import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  EllipsisVerticalIcon,
  KeyRoundIcon,
  PlusIcon,
  SquarePenIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserCogIcon,
} from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppLinkButton from '@/components/app/AppLinkButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { removeUser } from '@/features/workers/api/removeUser'
import EditWorkerForm from '@/features/workers/form/EditWorkerForm'
import PasswordForm from '@/features/workers/form/PasswordForm'
import { useUserDetail } from '@/features/workers/hooks/useUserDetail'
import { useUserList } from '@/features/workers/hooks/useUserList'
import { USER_ROLE } from '@/features/workers/lib/userRole'
import { userKeys } from '@/features/workers/queryKeys'
import type { UserRow } from '@/features/workers/types/user'
import { notify } from '@/lib/notify'

import AddFieldManagerForm from '../form/AddFieldManagerForm'
import { siteKeys } from '../queryKeys'

/**
 * 현장관리자 카드 (`spec 081`) — 본사 사업장 상세 왼쪽 열, 담당 관리자 아래.
 *
 * 🔴 **왜 여기 있나** — 본사 계정은 현장 사이트에 들어갈 수 없고(`spec 043`), 현장의 근무자 추가는 현장관리자가
 * 있어야 쓸 수 있다. 그래서 사업장의 현장관리자 계정은 **본사 사업장 상세에서** 만들고 고친다.
 * - 목록 = `UserList?siteId=&codeSeq=6`(현장 근무자 화면과 같은 API). 🔴 목록 응답에 **연락처가 없다** — 줄에는 이름 · 사번만
 *   적고, 정보 수정을 열 때 상세(`UserDetail`)를 받아 연락처를 채운다.
 * - 추가 · 정보 수정 · 비밀번호 변경 · 삭제 = `AddUser`(권한 6) · `UpdateUser` · `RemoveUser`. 본사 토큰으로 모두 200(실측 2026-11-17).
 * - 🔴 권한 구분 없이 본사 3종 모두 쓴다 — 사업장 수정 · 삭제와 같다(사용자 결정).
 */

/** 한 사업장의 현장관리자가 이보다 많을 일은 없다 — 서버 상한(100)으로 한 번에 받는다 */
const PAGE_SIZE = 100

type RowAction = { kind: 'edit' | 'password' | 'delete'; user: UserRow }

/** 정보 수정 — 연락처가 목록에 없어 상세를 받은 뒤 폼을 연다 */
const EditBody = ({ userSeq, onSuccess }: { userSeq: number; onSuccess: () => void }) => {
  const detail = useUserDetail(userSeq)
  if (detail.isError) {
    return <p className="py-6 text-center text-body text-muted-foreground">정보를 불러오지 못했습니다.</p>
  }
  if (detail.isPending) return <div aria-label="불러오는 중" className="h-48 animate-pulse rounded-md bg-muted" />
  return <EditWorkerForm user={detail.data} onSuccess={onSuccess} />
}

interface SiteFieldManagersCardProps {
  siteSeq: number
  siteName: string
}

const SiteFieldManagersCard = ({ siteSeq, siteName }: SiteFieldManagersCardProps) => {
  const queryClient = useQueryClient()
  const list = useUserList({ siteId: siteSeq, codeSeq: USER_ROLE.FIELD_MANAGER, pageNumber: 1, pageSize: PAGE_SIZE })
  const [addOpen, setAddOpen] = useState(false)
  const [action, setAction] = useState<RowAction | null>(null)
  const close = () => setAction(null)

  const remove = useMutation({
    mutationFn: removeUser,
    onSuccess: async (_, userSeq) => {
      queryClient.removeQueries({ queryKey: userKeys.detail(userSeq) })
      notify.success('현장관리자를 삭제했습니다.')
      // 삭제 영향 안내의 사용자 수(`userCount`)가 상세에서 온다 — 함께 다시 받는다
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.lists }),
        queryClient.invalidateQueries({ queryKey: siteKeys.detail(siteSeq) }),
      ])
    },
    // 이미 지워진 계정이면 400 이다 — 목록을 다시 받아 지금 상태를 보여 준다
    onError: () => queryClient.invalidateQueries({ queryKey: userKeys.lists }),
  })

  const rows = list.data?.items ?? []

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-panel-title font-bold text-foreground">현장관리자</h2>
          {list.data && <span className="text-caption text-muted-foreground">{rows.length}명</span>}
        </div>
        <AppLinkButton icon={PlusIcon} onClick={() => setAddOpen(true)}>
          추가
        </AppLinkButton>
      </div>

      <p className="text-caption text-muted-foreground">
        현장 사이트에 로그인해 이 사업장의 근무자 · 순찰을 관리하는 계정입니다.
      </p>

      {list.isError ? (
        <div>
          <AppEmpty icon={TriangleAlertIcon} title="현장관리자를 불러오지 못했습니다" />
          <div className="flex justify-center pb-2">
            <AppButton variant="sub" onClick={() => void list.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : list.isPending ? (
        <div aria-label="현장관리자 불러오는 중" className="h-14 animate-pulse rounded-md bg-muted" />
      ) : rows.length === 0 ? (
        <AppEmpty
          icon={UserCogIcon}
          title="현장관리자가 없습니다"
          description="현장관리자를 추가해야 현장 사이트에 로그인할 수 있습니다."
        />
      ) : (
        <ul aria-label="현장관리자" className="flex flex-col">
          {rows.map((user) => (
            <li key={user.userSeq} className="flex items-center gap-2 border-b border-border py-1.5 last:border-0">
              <span className="flex min-w-0 flex-1 items-baseline gap-1.5 text-body">
                <span className="min-w-0 truncate font-semibold text-foreground">{user.userName}</span>
                <span className="shrink-0 text-caption text-muted-foreground tabular-nums">{user.loginId}</span>
              </span>
              {/* modal={false} — 메뉴 항목에서 모달을 열 때 body pointer-events 가 남는 Radix 문제 회피(079 와 같다) */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  {/* 줄 안의 메뉴 — 관리그룹 편집과 같은 모양(세로 점 · 테두리 없음, 사용자 2026-11-17) */}
                  <AppIconButton
                    icon={EllipsisVerticalIcon}
                    iconSize={14}
                    aria-label={`${user.userName} 메뉴`}
                    className="shrink-0 border-0 p-1.5"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto">
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => setAction({ kind: 'edit', user })}>
                    <SquarePenIcon />
                    정보 수정
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => setAction({ kind: 'password', user })}>
                    <KeyRoundIcon />
                    비밀번호 변경
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    disabled={remove.isPending}
                    onSelect={() => setAction({ kind: 'delete', user })}
                  >
                    <Trash2Icon />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <AppDialog
        title="현장관리자 추가"
        description="이 사업장의 현장 사이트에 로그인할 계정을 만듭니다."
        contentClassName="sm:max-w-[520px]"
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <AddFieldManagerForm siteSeq={siteSeq} siteName={siteName} onSuccess={() => setAddOpen(false)} />
      </AppDialog>
      <AppDialog
        title="현장관리자 수정"
        description="현장관리자 정보를 수정합니다."
        contentClassName="sm:max-w-[520px]"
        open={action?.kind === 'edit'}
        onOpenChange={(open) => !open && close()}
      >
        {action?.kind === 'edit' && <EditBody userSeq={action.user.userSeq} onSuccess={close} />}
      </AppDialog>
      <AppDialog
        title="비밀번호 변경"
        description="현장관리자가 로그인에 쓸 새 비밀번호를 지정합니다."
        contentClassName="sm:max-w-[520px]"
        open={action?.kind === 'password'}
        onOpenChange={(open) => !open && close()}
      >
        {action?.kind === 'password' && <PasswordForm userSeq={action.user.userSeq} onSuccess={close} />}
      </AppDialog>
      {/* 삭제 확인은 확인 즉시 닫는다 — 잃을 입력이 없고 거부 사유는 전역 토스트가 전달한다(근무자 삭제와 같다) */}
      <AppAlertDialog
        open={action?.kind === 'delete'}
        onOpenChange={(open) => !open && close()}
        size="sm"
        icon={Trash2Icon}
        variant="destructive"
        title="현장관리자를 삭제하시겠습니까?"
        description={
          action?.kind === 'delete'
            ? `${action.user.userName}(${action.user.loginId}) 계정은 더 이상 현장 사이트에 로그인할 수 없습니다.`
            : undefined
        }
        actionLabel="삭제"
        onAction={() => action?.kind === 'delete' && remove.mutate(action.user.userSeq)}
      />
    </div>
  )
}

export default SiteFieldManagersCard
