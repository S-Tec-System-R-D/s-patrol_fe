import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  KeyRoundIcon,
  SquarePenIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UserRoundIcon,
} from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppPageHeader from '@/components/app/AppPageHeader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMe } from '@/features/auth/hooks/useMe'
import { removeUser } from '@/features/workers/api/removeUser'
import UserAssignmentCard from '@/features/workers/components/detail/UserAssignmentCard'
import UserInfoCard from '@/features/workers/components/detail/UserInfoCard'
import UserPatrolActivityCard from '@/features/workers/components/detail/UserPatrolActivityCard'
import EditWorkerForm from '@/features/workers/form/EditWorkerForm'
import PasswordForm from '@/features/workers/form/PasswordForm'
import { useUserDetail } from '@/features/workers/hooks/useUserDetail'
import { workLabel } from '@/features/workers/lib/userFormat'
import { userKeys } from '@/features/workers/queryKeys'
import { getSiteSeq } from '@/lib/auth/site'
import { notify } from '@/lib/notify'
import { paths } from '@/router/paths'

/**
 * 근무자 상세 (`spec 038` US2 → 🔄 **`spec 079` 개편** — 시안 `개선안/근무자`, 지점 상세 B 패턴).
 *
 * 머리(이름 · 근무 상태 · 소속 사업장 · `⋯`) / 왼쪽 고정 패널(기본정보 + 배치 이력) / 오른쪽 순찰 기록(회차 단위).
 *
 * 🔴 **현장관리자는 이 API 가 403 이다**(B-41) — 실서버에서는 "불러오지 못했습니다" 가 뜬다.
 * 🔴 조회 중과 "없음" 을 구분한다 — 단정하면 조회 중에 그것이 뜨는 순간 방금 지운 줄 안다(023).
 *
 * 정보 수정 · 비밀번호 변경은 **각각 다른 모달** → `UpdateUser`(`spec 041` US2 · US3) — 성공해야 닫힌다.
 * 삭제는 확인 → `RemoveUser` → 목록(US4). 🔴 본인 계정은 삭제할 수 없게 잠근다.
 * 🔄 세 동작은 머리 `⋯` 메뉴 안이다(079 — 076 지점 상세 · 074 코스 상세와 같다).
 */

const Breadcrumb = () => (
  <nav aria-label="현재 위치" className="flex items-center gap-1 text-caption">
    <Link to={paths.service.users} className="text-muted-foreground hover:text-foreground">
      근무자
    </Link>
    <ChevronRightIcon size={13} className="text-muted-foreground/60" />
    <span className="font-medium text-foreground">근무자 상세</span>
  </nav>
)

/** 🔴 실패 화면에서는 브레드크럼이 빠져나갈 길로 읽히지 않는다 — 복귀 수단을 따로 둔다(023) */
const BackToList = () => (
  <Link
    to={paths.service.users}
    className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
  >
    <ArrowLeftIcon size={14} />
    근무자 목록으로
  </Link>
)

const UserDetailPage = () => {
  const navigate = useNavigate()
  const { userSeq: raw } = useParams<{ userSeq: string }>()
  const parsed = Number(raw)
  /* 🔴 숫자가 아니면 **요청하지 않는다** — 주소가 잘못된 것이다 */
  const userSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = useUserDetail(userSeq)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const me = useMe()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: removeUser,
    onSuccess: async () => {
      // 🔴 이동을 **무효화보다 먼저** 한다 — 지운 근무자의 상세를 다시 읽어 실패 화면이 깜빡인다(029 승계)
      navigate(paths.service.users, { replace: true })
      notify.success('근무자를 삭제했습니다.')
      await queryClient.invalidateQueries({ queryKey: userKeys.lists })
    },
    // 다른 관리자가 이미 지웠으면 400 이다 — 상세를 다시 읽어 지금 상태(404 실패 화면)를 보여 준다
    onError: (_, deletedSeq) =>
      queryClient.invalidateQueries({ queryKey: userKeys.detail(deletedSeq) }),
  })
  /* 🔴 순찰 기록은 **선택한 사업장** 기준이다 — 상세의 `siteSeq` 는 소속지라(배치 온 사람은 다르다) 쓰지 않는다 */
  const siteSeq = getSiteSeq()

  if (userSeq === null) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <Breadcrumb />
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="근무자를 불러오지 못했습니다"
            description="주소가 올바르지 않습니다."
          />
          {/* 🔴 "다시 시도" 를 주지 않는다 — 같은 주소로 또 실패한다 */}
          <div className="flex justify-center pb-6">
            <BackToList />
          </div>
        </div>
      </div>
    )
  }

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <Breadcrumb />
        <div className="h-12 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <Breadcrumb />
        <div className="rounded-lg border border-border bg-card">
          {/* 🔴 "삭제되었다"·"권한이 없다" 고 단정하지 않는다 — 403(B-41)·네트워크·없는 번호가 모두 여기로 온다 */}
          <AppEmpty
            icon={TriangleAlertIcon}
            title="근무자를 불러오지 못했습니다"
            description={detail.error?.message}
          />
          <div className="flex flex-col items-center gap-3 pb-6">
            <AppButton variant="sub" onClick={() => void detail.refetch()}>
              다시 시도
            </AppButton>
            <BackToList />
          </div>
        </div>
      </div>
    )
  }

  const user = detail.data
  const isMe = me.data?.userSeq === user.userSeq

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <Breadcrumb />

      <AppPageHeader
        title={user.userName}
        icon={UserRoundIcon}
        titleSuffix={
          <span className="flex flex-wrap items-center gap-2">
            <AppBadge variant={user.workYn ? 'success' : 'muted'}>{workLabel(user.workYn)}</AppBadge>
            {/* 시안 — 상태 옆 소속 사업장. 상세 `siteName` 은 소속지다(실측) */}
            {user.siteName && <span className="text-caption text-muted-foreground">{user.siteName}</span>}
          </span>
        }
        action={
          /* 🔄 **`spec 079`**: 정보 수정 · 비밀번호 변경 · 삭제는 `⋯` 안 — 076 과 같다.
             modal={false} — 메뉴 항목에서 모달을 열 때 body pointer-events 가 남는 Radix 문제 회피 */
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <AppIconButton icon={EllipsisIcon} iconSize={16} aria-label="근무자 메뉴" className="bg-card" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
              <DropdownMenuItem className="cursor-pointer" onSelect={() => setEditOpen(true)}>
                <SquarePenIcon />
                정보 수정
              </DropdownMenuItem>
              {/* 🔴 **초기화가 아니라 변경**이다 — 서버는 `UpdateUser.loginPw` 로 새 값을 지정한다 */}
              <DropdownMenuItem className="cursor-pointer" onSelect={() => setPasswordOpen(true)}>
                <KeyRoundIcon />
                비밀번호 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* 🔴 본인 계정은 지울 수 없다 — 목록에 관리자도 섞여 온다(038). 처리 중에도 잠근다 */}
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                disabled={isMe || deleteMutation.isPending}
                title={isMe ? '본인 계정은 삭제할 수 없습니다' : undefined}
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2Icon />
                근무자 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* 🔄 **`spec 079`**: 왼쪽 **고정 패널**(기본정보 + 배치 이력) / 오른쪽 **순찰 기록**(나머지 폭) — 076 과 같은 틀.
          `xl` 미만 1단 — DOM 순서대로 "누구인가" 가 먼저. 🔴 `items-start` — 짧은 쪽이 긴 쪽 높이로 늘어나지 않게(036) */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <UserInfoCard user={user} />
          {/* 상세 `siteName` 은 소속지다(실측) — 배치 이력의 출발지로 쓴다(`spec 049`) */}
          <UserAssignmentCard userSeq={user.userSeq} homeSiteName={user.siteName} />
        </div>
        <UserPatrolActivityCard userSeq={user.userSeq} userName={user.userName} siteSeq={siteSeq} />
      </div>

      <AppDialog
        title="근무자 수정"
        description="근무자 정보를 수정합니다."
        contentClassName="sm:max-w-[520px]"
        open={editOpen}
        onOpenChange={setEditOpen}
      >
        <EditWorkerForm user={user} onSuccess={() => setEditOpen(false)} />
      </AppDialog>
      <AppDialog
        title="비밀번호 변경"
        description="근무자가 로그인에 쓸 새 비밀번호를 지정합니다."
        contentClassName="sm:max-w-[520px]"
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      >
        <PasswordForm userSeq={user.userSeq} onSuccess={() => setPasswordOpen(false)} />
      </AppDialog>
      {/* 삭제 확인은 확인 즉시 닫는다: 잃을 입력이 없고 거부 사유는 전역 토스트가 전달한다 */}
      <AppAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        size="sm"
        icon={Trash2Icon}
        variant="destructive"
        title="근무자를 삭제하시겠습니까?"
        actionLabel="삭제"
        onAction={() => deleteMutation.mutate(user.userSeq)}
      />
    </div>
  )
}

export default UserDetailPage
