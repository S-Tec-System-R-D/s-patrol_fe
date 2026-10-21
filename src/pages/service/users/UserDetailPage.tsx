import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  KeyRoundIcon,
  SquarePenIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import { useMe } from '@/features/auth/hooks/useMe'
import { removeUser } from '@/features/workers/api/removeUser'
import UserInfoCard from '@/features/workers/components/detail/UserInfoCard'
import UserPatrolCard from '@/features/workers/components/detail/UserPatrolCard'
import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import EditWorkerForm from '@/features/workers/form/EditWorkerForm'
import PasswordForm from '@/features/workers/form/PasswordForm'
import { useUserDetail } from '@/features/workers/hooks/useUserDetail'
import { workLabel } from '@/features/workers/lib/userFormat'
import { userKeys } from '@/features/workers/queryKeys'
import { getSiteSeq } from '@/lib/auth/site'
import { notify } from '@/lib/notify'
import { paths } from '@/router/paths'

/**
 * 근무자 상세 (`spec 038` US2) — 🔴 **신설**. 전에는 목록 우측 400px 패널이었다.
 *
 * 026 공지 상세와 같은 머리: 브레드크럼 → 머리 줄(아바타·이름·근무 상태·부제·액션) → 기본정보 카드.
 *
 * 🔴 **현장관리자는 이 API 가 403 이다**(B-41) — 실서버에서는 "불러오지 못했습니다" 가 뜬다.
 * 🔴 조회 중과 "없음" 을 구분한다 — 단정하면 조회 중에 그것이 뜨는 순간 방금 지운 줄 안다(023).
 *
 * 정보 수정·비밀번호 변경은 **각각 다른 모달** → `UpdateUser`(`spec 041` US2·US3) — 성공해야 닫힌다.
 * 삭제는 확인 → `RemoveUser` → 목록(US4). 🔴 본인 계정은 삭제할 수 없게 잠근다.
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
  const me = useMe()
  const queryClient = useQueryClient()

  /** 🔴 실패 토스트는 전역 `MutationCache` 가 띄운다 — 여기서 또 띄우지 않는다 */
  const deleteMutation = useMutation({
    mutationFn: removeUser,
    onSuccess: async (_, deletedSeq) => {
      // 🔴 이동을 **무효화보다 먼저** 한다 — 지운 근무자의 상세를 다시 읽어 실패 화면이 깜빡인다(029 승계)
      navigate(paths.service.users, { replace: true })
      queryClient.removeQueries({ queryKey: userKeys.detail(deletedSeq) })
      notify.success('근무자를 삭제했습니다.')
      await queryClient.invalidateQueries({ queryKey: userKeys.lists })
    },
    // 다른 관리자가 이미 지웠으면 400 이다 — 상세를 다시 읽어 지금 상태(404 실패 화면)를 보여 준다
    onError: (_, deletedSeq) =>
      queryClient.invalidateQueries({ queryKey: userKeys.detail(deletedSeq) }),
  })
  /* 🔴 순찰 기록은 **선택한 사업장** 기준이다 — 상세의 `siteSeq` 는 소속지라(배치 온 사람은 다르다) 쓰지 않는다 */
  const siteSeq = getSiteSeq()

  /** 🔴🔴 주소 오류를 로딩보다 먼저 분기한다 — `enabled: false` 는 영원히 `isPending` 이다(037 T557) */
  if (userSeq === null) {
    return (
      <div className="flex flex-col gap-4 p-8">
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
      <div className="flex flex-col gap-4 p-8">
        <Breadcrumb />
        <div className="h-12 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col gap-4 p-8">
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
    <div className="flex flex-col gap-4 p-8">
      <Breadcrumb />

      {/* 머리 줄 — 식별(아바타·이름·근무 상태)만. `AppPageHeader` 는 아이콘 자리에 lucide 아이콘만 받아 아바타를 넣을 수 없다.
          같은 배치(좌: 식별 / 우: 액션)를 직접 짠다 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <WorkerAvatar id={String(user.userSeq)} name={user.userName} className="size-11" />
          {/* 🔴 **부제를 두지 않는다**(사용자 결정 2026-10-21) — `사번 · 소속` 을 머리에 적으면
              기본정보 카드와 같은 말을 두 번 하고 카드에 새로 남는 값이 연락처 하나뿐이었다.
              값은 카드에 모은다 — 상세 응답의 권한·등록일(B-41)이 생기면 들어갈 자리도 카드다 */}
          <div className="flex items-center gap-2">
            <h1 className="truncate text-page-title font-bold text-foreground">{user.userName}</h1>
            <AppBadge variant={user.workYn ? 'success' : 'muted'}>{workLabel(user.workYn)}</AppBadge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* 🔴 **초기화가 아니라 변경**이다 — 서버는 `UpdateUser.loginPw` 로 새 값을 지정한다. 정보 수정과
              **다른 버튼**으로 둔다(사용자 결정 2026-10-21, OQ-038-C) */}
          <AppDialog
            title="비밀번호 변경"
            description="근무자가 로그인에 쓸 새 비밀번호를 지정합니다."
            open={passwordOpen}
            onOpenChange={setPasswordOpen}
            trigger={
              <AppButton icon={KeyRoundIcon} variant="sub" className="bg-card">
                비밀번호 변경
              </AppButton>
            }
          >
            <PasswordForm userSeq={user.userSeq} onSuccess={() => setPasswordOpen(false)} />
          </AppDialog>
          <AppDialog
            title="근무자 수정"
            description="근무자 정보를 수정할 수 있습니다."
            open={editOpen}
            onOpenChange={setEditOpen}
            trigger={
              <AppButton icon={SquarePenIcon} variant="sub" className="bg-card">
                수정
              </AppButton>
            }
          >
            <EditWorkerForm user={user} onSuccess={() => setEditOpen(false)} />
          </AppDialog>
          <AppAlertDialog
            size="sm"
            icon={Trash2Icon}
            variant="destructive"
            title="근무자를 삭제하시겠습니까?"
            onAction={() => deleteMutation.mutate(user.userSeq)}
          >
            <AppButton
              icon={Trash2Icon}
              variant="destructive"
              className="bg-card"
              // 🔴 본인 계정은 지울 수 없다 — 목록에 관리자도 섞여 온다(038). 처리 중에도 잠근다(확인 창은 즉시 닫힌다)
              disabled={isMe || deleteMutation.isPending}
              title={isMe ? '본인 계정은 삭제할 수 없습니다' : undefined}
            >
              삭제
            </AppButton>
          </AppAlertDialog>
        </div>
      </div>

      {/* **좌 2/3 최근 순찰 기록 / 우 1/3 기본정보** — 지점 상세(027·029)와 같은 배치(사용자 요청
          2026-10-21). 시간이 쌓이는 것이 좌측, 그 사람을 설명하는 값이 우측이다.
          🔴 **좁은 폭에서는 기본정보가 먼저**(`order`) — 1단이 되면 "누구인가" 가 먼저 와야 한다.
          🔴 `items-start` — 우측 카드가 좌측 높이만큼 늘어나지 않게(036) */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div className="order-2 xl:order-1 xl:col-span-2">
          <UserPatrolCard userSeq={user.userSeq} userName={user.userName} siteSeq={siteSeq} />
        </div>
        <div className="order-1 xl:order-2">
          <UserInfoCard user={user} />
        </div>
      </div>
    </div>
  )
}

export default UserDetailPage
