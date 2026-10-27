import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClockIcon,
  FilterXIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldIcon,
  TriangleAlertIcon,
  UsersIcon,
} from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppInput from '@/components/app/AppInput'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppSelect from '@/components/app/AppSelect'
import AppTable from '@/components/AppTable'
import {
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import { toPageIndex, toPageNumber } from '@/features/courses/lib/courseListParams'
import WorkerCard from '@/features/workers/components/WorkerCard'
import { workerColumns } from '@/features/workers/components/WorkerColumns'
import AddWorkerForm from '@/features/workers/form/AddWorkerForm'
import { useUserList } from '@/features/workers/hooks/useUserList'
import { toUserListParams, type UserQuery } from '@/features/workers/lib/userListParams'
import { roleFilterOptions, workFilterOptions } from '@/features/workers/lib/userRole'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteName, getSiteSeq } from '@/lib/auth/site'
import { ALL_VALUE } from '@/lib/listQuery'
import { paths } from '@/router/paths'

/**
 * 근무자 목록 (`spec 038` US1).
 *
 * 🔴 **테이블 + 우측 패널에서 목록 + 상세 페이지로 바꿨다**(사용자 결정 2026-10-21) — 지점(027)·
 * 코스·순찰이력·공지(026)와 같은 구조다. 골격은 026 `NoticeListPage` 와 같다.
 *
 * 🔴 **현장관리자는 이 API 가 403 이다**(B-41) — 실서버에서는 "불러오지 못했습니다" 가 뜬다.
 * 문구가 권한을 단정하지 않는 이유는 B-41 이 풀리면 그 문구가 거짓이 되기 때문이다.
 *
 * 추가는 모달 → `AddUser`(`spec 041`). 성공해야 닫히고 목록에 머문다(서버가 ID 를 주지 않는다).
 */

type FilterKey = keyof UserQuery
const SEARCH_DEBOUNCE_MS = 300

const UsersPage = () => {
  const navigate = useNavigate()
  const siteSeq = getSiteSeq()
  /**
   * 🔴 **선택한 사업장 이름**을 쓴다. 전에는 `useMe().locationName` 이었는데 그 값은 JWT 클레임에
   * **없어서**(020) 항상 `undefined` — 부제가 한 번도 나오지 않았다.
   */
  const siteName = getSiteName()

  const [params, setParams] = useQueryParams<FilterKey>()
  const query: UserQuery = useMemo(
    () => ({
      q: params.q,
      role: params.role,
      work: params.work,
      page: params.page,
      size: params.size,
    }),
    [params.q, params.role, params.work, params.page, params.size]
  )

  /** 🔴 행 수는 URL 에 두지 않지만 동작은 한다(027·036·037·026 승계). 바꾸면 첫 페이지로 */
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [addOpen, setAddOpen] = useState(false)

  const listParams = useMemo(
    () => (siteSeq === null ? null : { ...toUserListParams(siteSeq, query), pageSize }),
    [siteSeq, query, pageSize]
  )
  const list = useUserList(listParams)
  const items = list.data?.items ?? []

  /** 🔴 메모이즈한다 — 렌더마다 만들면 행이 리마운트되어 포커스가 날아간다(027) */
  const columns = useMemo(() => workerColumns(), [])

  /** 🔴 필터를 바꾸면 첫 페이지로 · `replace` 가 아니다(뒤로가기가 필터 이전으로) — 026 승계 */
  const updateFilter = (next: Partial<Record<FilterKey, string | undefined>>) => {
    setParams({ ...next, page: undefined })
  }

  /** 🔴 "전체" 는 값이 아니라 **해제**다 — URL·서버 파라미터에서 키를 지운다 */
  const selectValue = (value: string) => (value === ALL_VALUE ? undefined : value)

  /**
   * 🔴 입력은 로컬 state, URL 은 디바운스 뒤에. URL 이 밖에서 바뀌면(뒤로가기·초기화) 입력창을
   * 맞춘다 — 렌더 중 조정(026 승계).
   *
   * 🔴 **"이름·사번 검색"** 이다 — 서버 `searchKey` 는 이름 + 사번을 거르고 **연락처는 거르지
   * 않는다**(실측 2026-10-21). 구 화면의 "이름 또는 연락처 검색" 을 두면 번호를 넣고 0건을 받는다.
   */
  const [keywordDraft, setKeywordDraft] = useState(params.q ?? '')
  const [lastKeyword, setLastKeyword] = useState(params.q)
  if (params.q !== lastKeyword) {
    setLastKeyword(params.q)
    setKeywordDraft(params.q ?? '')
  }
  const pushKeyword = useDebouncedCallback(
    (value: string) => updateFilter({ q: value.trim() || undefined }),
    SEARCH_DEBOUNCE_MS
  )

  const pageNumber = parsePageNumber(params.page)
  const hasFilter = Boolean(params.q || params.role || params.work)
  const resetFilters = () =>
    setParams({ q: undefined, role: undefined, work: undefined, page: undefined })

  /** 부제 — 서버 `totalCount` 기준이라 필터가 걸리면 걸린 수다. 로딩·실패 중에는 이름만 */
  const subtitle = siteName
    ? list.data
      ? `${siteName} 소속 ${list.data.totalCount}명`
      : siteName
    : undefined

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <AppPageHeader title="근무자" subtitle={subtitle} />

      {/* 🔴 026 과 같은 한 줄 배치 — 검색 → 필터 → spacer → 생성 버튼(`PointTopNav` 모양).
          🔴 필터 영역에만 이름을 붙인다(`spec 030` — 카드 `button` 과 이름이 겹친다) */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
        <AppInput
          variant="search"
          placeholder="이름·사번 검색"
          aria-label="이름·사번 검색"
          className="w-full xl:w-[260px]"
          value={keywordDraft}
          onChange={(event) => {
            setKeywordDraft(event.target.value)
            pushKeyword(event.target.value)
          }}
        />
        <div role="group" aria-label="목록 필터" className="contents">
          <AppSelect
            aria-label="권한"
            icon={ShieldIcon}
            options={roleFilterOptions}
            value={params.role ?? ALL_VALUE}
            onChange={(value) => updateFilter({ role: selectValue(value) })}
            active={Boolean(params.role)}
            className="w-auto"
          />
          <AppSelect
            aria-label="근무 상태"
            icon={ClockIcon}
            options={workFilterOptions}
            value={params.work ?? ALL_VALUE}
            onChange={(value) => updateFilter({ work: selectValue(value) })}
            active={Boolean(params.work)}
            className="w-auto"
          />
          {hasFilter && (
            <AppIconButton
              icon={RotateCcwIcon}
              aria-label="필터 초기화"
              title="필터 초기화"
              onClick={resetFilters}
              className="bg-card"
            />
          )}
        </div>
        <div className="flex-1" />
        <AppDialog
          title="근무자 추가"
          description="새 근무자를 등록합니다."
          contentClassName="sm:max-w-[520px]"
          open={addOpen}
          onOpenChange={setAddOpen}
          trigger={
            /* 🔴 `xl` 미만에서는 아이콘만 — `aria-label` 로 이름을 유지한다(`PointTopNav` 승계) */
            <AppButton
              icon={PlusIcon}
              iconSize={14}
              aria-label="근무자 추가"
              // 사업장이 없으면 목록도 요청하지 않는다 — 같은 기준으로 막는다
              disabled={siteSeq === null}
              className="h-9 px-3 xl:px-4"
            >
              <span className="hidden xl:inline">근무자 추가</span>
            </AppButton>
          }
        >
          <AddWorkerForm onSuccess={() => setAddOpen(false)} />
        </AppDialog>
      </div>

      {list.isError ? (
        /* 🔴 조회 실패와 0건을 다르게 그린다. 🔴 403(B-41)도 여기로 온다 — 권한을 단정하지 않는다 */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="근무자를 불러오지 못했습니다"
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
        <div aria-label="근무자 불러오는 중" className="rounded-sm border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
              <div className="h-[22px] animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          {hasFilter ? (
            <AppEmpty
              icon={FilterXIcon}
              title="조건에 맞는 근무자가 없습니다"
              description="검색어나 필터를 바꿔보세요."
            />
          ) : (
            <AppEmpty
              icon={UsersIcon}
              title="등록된 근무자가 없습니다"
              description="근무자를 추가하면 여기에 표시됩니다."
            />
          )}
        </div>
      ) : (
        <>
          <AppTable
            columns={columns}
            data={items}
            // 🔴 `hidePagination` 은 `manualPagination` 을 함께 건다 — 클라이언트 페이징을 끈다
            hidePagination
            // 🔴 OQ-030-A 종결 — 우측 패널이 사라져 카드가 들어갈 폭이 생겼다
            renderCard={WorkerCard}
            onRowClick={(row) => navigate(paths.service.userDetail(row.userSeq))}
          />

          <AppPagination
            pageIndex={toPageIndex(pageNumber)}
            pageSize={pageSize}
            total={list.data?.totalCount ?? items.length}
            // 🔴 100 을 넘기지 않는다 — 서버 상한이다
            pageSizeOptions={[20, 50, 100]}
            onPageChange={(pageIndex) => setParams({ page: String(toPageNumber(pageIndex)) })}
            onPageSizeChange={(next) => {
              setPageSize(next)
              setParams({ page: undefined })
            }}
          />
        </>
      )}
    </div>
  )
}

export default UsersPage
