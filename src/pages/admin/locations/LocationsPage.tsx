import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2Icon, FilterXIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppInput from '@/components/app/AppInput'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppTable from '@/components/AppTable'
import { GroupEditTrigger } from '@/features/groups/components/GroupEditTrigger'
import { GroupFilterButton } from '@/features/groups/components/GroupFilterButton'
import { GroupFilterPanel } from '@/features/groups/components/GroupFilterPanel'
import { useGroupList } from '@/features/groups/hooks/useGroupList'
import { useGroupParam } from '@/features/groups/hooks/useGroupParam'
import { useGroupTree } from '@/features/groups/hooks/useGroupTree'
import { branchSiteCount } from '@/features/groups/lib/groupTree'
import SiteCard from '@/features/sites/components/SiteCard'
import { siteColumns } from '@/features/sites/components/SiteColumns'
import SiteForm from '@/features/sites/form/SiteForm'
import { toAddSiteRequest } from '@/features/sites/form/schema'
import { useAddSite } from '@/features/sites/hooks/useSiteMutations'
import { collectSiteRows, findListGroup, isBranch } from '@/features/sites/lib/siteList'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useQueryParams } from '@/hooks/useQueryParams'
import { paths } from '@/router/paths'

/**
 * 본사 사업장 `/admin/locations` (`spec 043` T752 골격 · `spec 044` US1 목록).
 *
 * XL 이상 = 좌측 관리그룹 패널 + 본문 / XL 미만 = 필터 줄 맨 앞 경로 버튼 + 본문(목업 v2 `SitesPage`).
 *
 * 🔴 **트리가 둘이다** — 좌측 패널과 `?group` 은 043 그대로 `AdminSiteSelect`, 목록은 `GetGroupList`
 * (주소 등 목록 필드가 거기에만 있다). 패널을 바꾸지 않는다(사용자 결정 2026-10-23). 같은 `groupSeq` 로 잇는다.
 * 🔴 **서버 필터 · 페이지네이션 없음** — 응답이 전체 트리이고 지사당 사업장이 적다(사용자 판단 2026-10-23).
 * 🔴 **추가 후에는 목록에 머문다** — 서버가 새 `siteSeq` 를 주지 않는다. 모 사업장도 고를 수 있다(`spec 051` — 044 의 "최상위만" 을 뒤집음).
 */

const SEARCH_DEBOUNCE_MS = 300

const LocationsPage = () => {
  const navigate = useNavigate()
  const tree = useGroupTree()
  const { selected } = useGroupParam(tree.data)
  const list = useGroupList()
  const addSite = useAddSite()
  const [addOpen, setAddOpen] = useState(false)

  const [params, setParams] = useQueryParams<'q'>()

  /**
   * 🔴 입력은 로컬 state, URL 은 디바운스 뒤에. URL 이 밖에서 바뀌면(뒤로가기) 입력창을 맞춘다 — 렌더 중 조정(`UsersPage` 승계).
   * 검색은 **이름 · 주소**(목업) — 클라이언트에서 거른다.
   */
  const [keywordDraft, setKeywordDraft] = useState(params.q ?? '')
  const [lastKeyword, setLastKeyword] = useState(params.q)
  if (params.q !== lastKeyword) {
    setLastKeyword(params.q)
    setKeywordDraft(params.q ?? '')
  }
  const pushKeyword = useDebouncedCallback(
    (value: string) => setParams({ q: value.trim() || undefined }),
    SEARCH_DEBOUNCE_MS
  )

  const groupSeq = selected?.groupSeq ?? null
  /** 그룹 범위 전체(검색 전) — 부제 · 빈 상태 구분에 쓴다 */
  const scopedRows = useMemo(
    () => (list.data ? collectSiteRows(list.data, groupSeq) : []),
    [list.data, groupSeq]
  )
  const rows = useMemo(
    () => (list.data ? collectSiteRows(list.data, groupSeq, params.q ?? '') : []),
    [list.data, groupSeq, params.q]
  )
  /** 🔴 메모이즈한다 — 렌더마다 만들면 행이 리마운트된다(027) */
  const columns = useMemo(() => siteColumns(), [])
  /** 지금 보고 있는 그룹이 지사면 그 지사를 기본값으로(본부는 `SiteForm` 이 지사에서 찾는다) */
  const selectedListGroup = list.data && groupSeq !== null ? findListGroup(list.data, groupSeq) : null
  const defaultGroupSeq = selectedListGroup && isBranch(selectedListGroup) ? String(selectedListGroup.groupSeq) : ''

  const filterProps = { unitLabel: '사업장', count: branchSiteCount, headerAction: <GroupEditTrigger /> }
  const subtitle = selected && list.data ? `${selected.groupName} 하위 사업장 ${scopedRows.length}개` : undefined

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <AppPageHeader title="사업장" subtitle={subtitle} />
      <div className="flex gap-4 items-start">
        <div className="hidden xl:block shrink-0 sticky top-6 self-start">
          <GroupFilterPanel {...filterProps} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
            <div className="xl:hidden">
              <GroupFilterButton {...filterProps} />
            </div>
            <AppInput
              variant="search"
              placeholder="사업장명·주소 검색"
              aria-label="사업장명·주소 검색"
              className="w-full xl:w-[260px]"
              value={keywordDraft}
              onChange={(event) => {
                setKeywordDraft(event.target.value)
                pushKeyword(event.target.value)
              }}
            />
            <div className="flex-1" />
            {/* 다른 목록 화면과 같이 필터 줄 끝에 둔다(`UsersPage` 승계) */}
            <AppDialog
              title="사업장 추가"
              description="새 사업장을 등록합니다."
              open={addOpen}
              onOpenChange={setAddOpen}
              contentClassName="sm:max-w-[520px]"
              trigger={
                /* 🔴 `xl` 미만에서는 아이콘만 — `aria-label` 로 이름을 유지한다 */
                <AppButton
                  icon={PlusIcon}
                  iconSize={14}
                  aria-label="사업장 추가"
                  // 선택지가 목록 응답에서 나온다 — 받기 전에는 열지 않는다
                  disabled={!list.data}
                  className="h-9 px-3 xl:px-4"
                >
                  <span className="hidden xl:inline">사업장 추가</span>
                </AppButton>
              }
            >
              {list.data && (
                <SiteForm
                  root={list.data}
                  defaultValues={{ groupSeq: defaultGroupSeq }}
                  submitLabel="등록"
                  pending={addSite.isPending}
                  onSubmit={(data) => addSite.mutate(toAddSiteRequest(data), { onSuccess: () => setAddOpen(false) })}
                  onCancel={() => setAddOpen(false)}
                />
              )}
            </AppDialog>
          </div>

          {list.isError ? (
            /* 🔴 조회 실패와 0건을 다르게 그린다 */
            <div className="rounded-lg border border-border bg-card">
              <AppEmpty
                icon={TriangleAlertIcon}
                title="사업장을 불러오지 못했습니다"
                description={list.error?.message}
              />
              <div className="flex justify-center pb-6">
                <AppButton variant="sub" onClick={() => void list.refetch()}>
                  다시 시도
                </AppButton>
              </div>
            </div>
          ) : list.isPending ? (
            /* 🔴 로딩을 "데이터 없음" 으로 보여주지 않는다 */
            <div aria-label="사업장 불러오는 중" className="rounded-sm border border-border bg-card">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
                  <div className="h-[22px] animate-pulse rounded-md bg-muted" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-border bg-card">
              {scopedRows.length > 0 ? (
                <AppEmpty
                  icon={FilterXIcon}
                  title="검색 결과가 없습니다"
                  description="검색어를 바꿔보세요."
                />
              ) : (
                <AppEmpty icon={Building2Icon} title="이 그룹에 등록된 사업장이 없습니다" />
              )}
            </div>
          ) : (
            <>
              <AppTable
                columns={columns}
                data={rows}
                // 🔴 `hidePagination` 은 `manualPagination` 을 함께 건다 — 전체를 한 번에 그린다
                hidePagination
                // 🔴 `xl` 미만에서는 카드로(046 #18)
                renderCard={SiteCard}
                // 🔴 하위 사업장 카드는 들여쓴다(A안, 사용자 결정 2026-10-26). 표의 `tr` 에는 margin 이 먹지 않아 카드에만 보인다
                rowClassName={(row) => (row.depth === 0 ? '' : row.depth === 1 ? 'ml-4' : 'ml-8')}
                onRowClick={(row) => navigate(paths.admin.locationDetail(String(row.site.siteSeq)))}
              />
              <p className="text-caption text-muted-foreground">
                총 <b className="text-foreground">{rows.length}</b>개
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default LocationsPage
