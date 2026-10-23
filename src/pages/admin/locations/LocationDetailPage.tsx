import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, SquarePenIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import { useGroupAdminList } from '@/features/groups/hooks/useGroupAdminList'
import { useGroupList } from '@/features/groups/hooks/useGroupList'
import EmergencyContactCard from '@/features/sites/components/EmergencyContactCard'
import HealthCheckCard from '@/features/sites/components/HealthCheckCard'
import SiteDeleteDialog from '@/features/sites/components/SiteDeleteDialog'
import SiteInfoCard from '@/features/sites/components/SiteInfoCard'
import SiteManagersCard from '@/features/sites/components/SiteManagersCard'
import SiteForm from '@/features/sites/form/SiteForm'
import { toUpdateSiteRequest } from '@/features/sites/form/schema'
import { useSiteDetail } from '@/features/sites/hooks/useSiteDetail'
import { useDeleteSite, useUpdateSiteInfo } from '@/features/sites/hooks/useSiteMutations'
import { countDescendantSites, findSite, groupOptions, groupPathText } from '@/features/sites/lib/siteList'
import { paths } from '@/router/paths'

/**
 * 본사 사업장 상세 `/admin/locations/:id` (`spec 044` US3) — 목업 v2 `SiteDetail`.
 *
 * 머리(뒤로 · 그룹 경로 · 이름) → 좌 기본정보 + [정보 수정] [삭제] / 우 담당 관리자 · 헬스체크 · 비상연락망.
 * 🔴 목업의 KPI형 요약 · 탭 · [운영 중지] · 계약 기간은 **없다** — 다른 상세와 같은 좌우 구조로 한 화면에 둔다(사용자 결정 2026-10-23).
 *
 * 🔴 **출처가 둘이다** — 값은 `GetSiteDetail`, 소속 그룹 · 모 사업장 · 하위 사업장은 `GetGroupList` 노드(상세에 없다).
 * 🔴 조회 중과 "없음" 을 구분한다 — 없는 사업장은 400 "잘못된 요청입니다."(실측)이고 네트워크 실패와 구분되지 않아
 * "찾을 수 없음" 으로 단정하지 않는다(`UserDetailPage` 승계).
 */

const CHILD_GROUP_HINT = '하위 사업장은 관리그룹을 변경할 수 없습니다. 모 사업장을 이동해주세요.'

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
  const admins = useGroupAdminList(found?.group.groupSeq ?? null)
  const updateSite = useUpdateSiteInfo()
  const deleteSite = useDeleteSite()
  const [editOpen, setEditOpen] = useState(false)

  /** 목록으로 — 이 사업장의 지사를 고른 채로 돌아간다 */
  const listPath = found ? `${paths.admin.locations}?group=${found.group.groupSeq}` : paths.admin.locations

  /** 🔴🔴 주소 오류를 로딩보다 먼저 분기한다 — `enabled: false` 는 영원히 `isPending` 이다(037 T557) */
  if (siteSeq === null || detail.isError) {
    return (
      <div className="flex flex-col gap-4 p-8">
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
      <div aria-label="사업장 불러오는 중" className="flex flex-col gap-4 p-8">
        <div className="h-12 w-80 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  const site = detail.data
  const groupPath = list.data && found ? groupPathText(list.data, found.group.groupSeq) : null
  const isChild = found ? found.site.parentSiteSeq !== null : false
  const childCount = found ? countDescendantSites(found.site) : 0
  const groupHint = isChild
    ? CHILD_GROUP_HINT
    : childCount > 0
      ? `하위 사업장 ${childCount}개도 함께 이동합니다.`
      : undefined

  return (
    <div className="flex flex-col gap-4 p-8">
      {/* 머리 — 뒤로 · 경로 · 이름만. 🔴 액션은 기본정보 카드 아래(근무자 상세와 같다 — 사용자 결정 2026-10-23) */}
      <div className="flex items-center gap-3">
        <Link
          to={listPath}
          aria-label="사업장 목록으로"
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon size={16} />
        </Link>
        <div className="flex min-w-0 flex-col">
          {groupPath && <span className="text-caption text-muted-foreground">{groupPath}</span>}
          <h1 className="truncate text-page-title font-bold text-foreground">{site.siteName}</h1>
        </div>
      </div>

      {/* 좌 1/3 기본정보 + 액션 / 우 2/3 담당 관리자 · 헬스체크 — 근무자 · 지점 상세와 같은 구조(사용자 결정 2026-10-23).
          🔴 `items-start` + 좌측을 `div` 로 감싼다 — `AppDetailCard` 가 `h-full` 이라 칸에 바로 두면 우측 높이까지 늘어난다 */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-2">
          <SiteInfoCard detail={site} groupPath={groupPath} childCount={childCount} />
          <div className="flex gap-2">
            <AppDialog
              title="사업장 정보 수정"
              description="사업장 정보를 수정합니다."
              open={editOpen}
              onOpenChange={setEditOpen}
              contentClassName="sm:max-w-[520px]"
              trigger={
                // 소속 그룹 · 하위 여부가 목록 노드에서 나온다 — 찾기 전에는 열지 않는다
                <AppButton
                  icon={SquarePenIcon}
                  variant="sub"
                  className="flex-auto whitespace-nowrap bg-card"
                  disabled={!found}
                >
                  정보 수정
                </AppButton>
              }
            >
              {found && list.data && (
                <SiteForm
                  // 🔴 지사가 아닌 현재 그룹(실서버의 회사·본부 소속)도 선택지에 남긴다 — 그대로 저장할 수 있게
                  options={groupOptions(list.data, found.group.groupSeq)}
                  defaultValues={{
                    siteName: site.siteName,
                    groupSeq: String(found.group.groupSeq),
                    address: site.address ?? '',
                    tel: site.tel ?? '',
                  }}
                  groupDisabled={isChild}
                  groupHint={groupHint}
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
              pending={deleteSite.isPending}
              onConfirm={() =>
                deleteSite.mutate(site.siteSeq, {
                  // 🔴 지운 상세를 다시 읽지 않게 바로 떠난다(`UserDetailPage` 승계)
                  onSuccess: () => navigate(listPath, { replace: true }),
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-2">
          <SiteManagersCard
            admins={admins.data}
            // 소속 그룹을 아직 모르면(목록 조회 중) 로딩으로 본다. 목록에 없는 사업장이면 빈 상태
            isPending={!list.isError && (found ? admins.isPending : !list.data)}
            isError={admins.isError || list.isError}
            onRetry={() => void (list.isError ? list.refetch() : admins.refetch())}
          />
          <HealthCheckCard detail={site} />
          <EmergencyContactCard />
        </div>
      </div>
    </div>
  )
}

export default LocationDetailPage
