import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronRightIcon, EllipsisIcon, SquarePenIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGroupList } from '@/features/groups/hooks/useGroupList'
import EmergencyContactCard from '@/features/sites/components/EmergencyContactCard'
import HealthCheckCard from '@/features/sites/components/HealthCheckCard'
import SiteDeleteDialog from '@/features/sites/components/SiteDeleteDialog'
import SiteInfoCard from '@/features/sites/components/SiteInfoCard'
import SiteManagersCard from '@/features/sites/components/SiteManagersCard'
import { useSiteManagers } from '@/features/sites/hooks/useSiteManagers'
import SiteForm from '@/features/sites/form/SiteForm'
import { toUpdateSiteRequest } from '@/features/sites/form/schema'
import { useSiteDetail } from '@/features/sites/hooks/useSiteDetail'
import { useDeleteSite, useUpdateSiteInfo } from '@/features/sites/hooks/useSiteMutations'
import { countDescendantSites, findSite, groupPathText } from '@/features/sites/lib/siteList'
import { paths } from '@/router/paths'

/**
 * 본사 사업장 상세 `/admin/locations/:id` (`spec 044` US3) — 목업 v2 `SiteDetail`.
 *
 * 머리(그룹 경로 · 이름 · `⋯`) → 좌 400px 기본정보 + 담당 관리자 / 우 헬스체크 · 비상연락망.
 * 🔄 **`spec 080`**(시안 `개선안/사업장`): 수정 · 삭제는 머리 `⋯`(근무자 상세와 같다) · 담당 관리자를 왼쪽 열로.
 * 🔴 목업의 KPI형 요약 · 탭 · [운영 중지] · 계약 기간은 **없다** — 다른 상세와 같은 좌우 구조로 한 화면에 둔다(사용자 결정 2026-10-23).
 *
 * 🔴 **출처가 둘이다** — 값은 `GetSiteDetail`, 소속 그룹 · 모 사업장 · 하위 사업장은 `GetGroupList` 노드(상세에 없다).
 * 🔴 조회 중과 "없음" 을 구분한다 — 없는 사업장은 400 "잘못된 요청입니다."(실측)이고 네트워크 실패와 구분되지 않아
 * "찾을 수 없음" 으로 단정하지 않는다(`UserDetailPage` 승계).
 */

const CHILD_GROUP_HINT = '하위 사업장은 관리그룹을 변경할 수 없습니다. 모 사업장을 이동해주세요.'

/** 현장 상세와 같은 머리(046 #3, 사용자 결정 2026-10-26 — 044 의 뒤로 버튼을 바꿨다). 목록은 이 사업장의 지사를 고른 채로 */
const Breadcrumb = ({ listPath }: { listPath: string }) => (
  <nav aria-label="현재 위치" className="flex items-center gap-1 text-caption">
    <Link to={listPath} className="text-muted-foreground hover:text-foreground">
      사업장
    </Link>
    <ChevronRightIcon size={13} className="text-muted-foreground/60" />
    <span className="font-medium text-foreground">사업장 상세</span>
  </nav>
)

/** 🔴 실패 화면에도 빠져나갈 길을 둔다(023) */
const BackToList = () => (
  <Link
    to={paths.admin.locations}
    className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
  >
    <ArrowLeftIcon size={14} />
    사업장 목록으로
  </Link>
)

const LocationDetailPage = () => {
  const navigate = useNavigate()
  const { id: raw } = useParams<{ id: string }>()
  const parsed = Number(raw)
  /* 🔴 숫자가 아니면 **요청하지 않는다** — 주소가 잘못된 것이다 */
  const siteSeq = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  const detail = useSiteDetail(siteSeq)
  const list = useGroupList()
  const found = list.data && siteSeq !== null ? findSite(list.data, siteSeq) : null
  const managers = useSiteManagers(siteSeq)
  const updateSite = useUpdateSiteInfo()
  const deleteSite = useDeleteSite()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  /** 목록으로 — 이 사업장의 지사를 고른 채로 돌아간다 */
  const listPath = found ? `${paths.admin.locations}?group=${found.group.groupSeq}` : paths.admin.locations

  /** 🔴🔴 주소 오류를 로딩보다 먼저 분기한다 — `enabled: false` 는 영원히 `isPending` 이다(037 T557) */
  if (siteSeq === null || detail.isError) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <Breadcrumb listPath={listPath} />
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="사업장을 불러오지 못했습니다"
            description={siteSeq === null ? '주소가 올바르지 않습니다.' : detail.error?.message}
          />
          <div className="flex flex-col items-center gap-3 pb-6">
            {/* 🔴 주소가 틀렸으면 "다시 시도" 를 주지 않는다 — 같은 주소로 또 실패한다 */}
            {siteSeq !== null && (
              <AppButton variant="sub" onClick={() => void detail.refetch()}>
                다시 시도
              </AppButton>
            )}
            <BackToList />
          </div>
        </div>
      </div>
    )
  }

  if (detail.isPending) {
    return (
      <div aria-label="사업장 불러오는 중" className="flex flex-col gap-4 p-4 xl:p-8">
        <Breadcrumb listPath={listPath} />
        <div className="h-12 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  const site = detail.data
  const groupPath = list.data && found ? groupPathText(list.data, found.group.groupSeq) : null
  const isChild = found ? found.site.parentSiteSeq !== null : false
  const parentName =
    list.data && found?.site.parentSiteSeq != null
      ? findSite(list.data, found.site.parentSiteSeq)?.site.siteName
      : undefined
  const childCount = found ? countDescendantSites(found.site) : 0
  const groupHint = isChild
    ? CHILD_GROUP_HINT
    : childCount > 0
      ? `하위 사업장 ${childCount}개도 함께 이동합니다.`
      : undefined

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <Breadcrumb listPath={listPath} />

      {/* 머리 — 경로 · 이름 · `⋯`(spec 080). 소속 경로는 여기 한 곳(기본정보의 소속 그룹 행을 지웠다) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          {groupPath && <span className="text-caption text-muted-foreground">{groupPath}</span>}
          <h1 className="truncate text-page-title font-bold text-foreground">{site.siteName}</h1>
        </div>
        {/* modal={false} — 메뉴 항목에서 모달을 열 때 body pointer-events 가 남는 Radix 문제 회피(079 와 같다) */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <AppIconButton icon={EllipsisIcon} iconSize={16} aria-label="사업장 메뉴" className="shrink-0 bg-card" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto">
            {/* 소속 그룹 · 하위 여부가 목록 노드에서 나온다 — 찾기 전에는 열지 않는다 */}
            <DropdownMenuItem className="cursor-pointer" disabled={!found} onSelect={() => setEditOpen(true)}>
              <SquarePenIcon />
              사업장 수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              disabled={deleteSite.isPending}
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2Icon />
              사업장 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 좌 400px 기본정보 + 담당 관리자 / 우 헬스체크 · 비상연락망 — 근무자 · 지점 상세 패턴(spec 080).
          🔴 `items-start` + 좌측을 `div` 로 감싼다 — `AppDetailCard` 가 `h-full` 이라 칸에 바로 두면 우측 높이까지 늘어난다 */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <SiteInfoCard
            detail={site}
            childSites={found ? found.site.children.map(({ siteSeq: seq, siteName }) => ({ siteSeq: seq, siteName })) : []}
          />
          {/* 🔄 057: 출처 = `GetSiteManagerList`(사업장 기준) — 소속 그룹을 몰라도 부른다 */}
          <SiteManagersCard
            managers={managers.data}
            isPending={managers.isPending}
            isError={managers.isError}
            onRetry={() => void managers.refetch()}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <HealthCheckCard detail={site} />
          <EmergencyContactCard siteSeq={site.siteSeq} />
        </div>
      </div>

      <AppDialog
        title="사업장 수정"
        description="사업장 정보를 수정합니다."
        open={editOpen}
        onOpenChange={setEditOpen}
        contentClassName="sm:max-w-[520px]"
      >
        {found && list.data && (
          <SiteForm
            root={list.data}
            defaultValues={{
              siteName: site.siteName,
              groupSeq: String(found.group.groupSeq),
              address: site.address ?? '',
              tel: site.tel ?? '',
            }}
            groupDisabled={isChild}
            groupHint={groupHint}
            // 🔴 모 사업장은 바꿀 수 없다(`UpdateSite` 에 없음) — 보여주기만
            parentLocked
            parentName={parentName}
            submitLabel="저장"
            pending={updateSite.isPending}
            onSubmit={(data) =>
              updateSite.mutate(toUpdateSiteRequest(site.siteSeq, data, !isChild), {
                onSuccess: () => setEditOpen(false),
              })
            }
            onCancel={() => setEditOpen(false)}
          />
        )}
      </AppDialog>
      <SiteDeleteDialog
        siteName={site.siteName}
        impact={{
          childSites: childCount,
          courses: site.courseCount,
          points: site.pointCount,
          users: site.userCount,
        }}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() =>
          deleteSite.mutate(site.siteSeq, {
            // 🔴 지운 상세를 다시 읽지 않게 바로 떠난다(`UserDetailPage` 승계)
            onSuccess: () => navigate(listPath, { replace: true }),
          })
        }
      />
    </div>
  )
}

export default LocationDetailPage
