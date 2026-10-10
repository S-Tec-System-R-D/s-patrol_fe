import { useMemo, useState } from 'react'
import { FilterXIcon, MapPinIcon, TriangleAlertIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import CourseTabs from '@/features/zone/components/CourseTabs'
import { pointColumns } from '@/features/points/components/PointColumn'
import PointFilters from '@/features/points/components/PointFilters'
import PointTopNav from '@/features/points/components/PointTopNav'
import { usePointList } from '@/features/points/hooks/usePointList'
import {
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
  toPageIndex,
  toPageNumber,
  type PointListQuery,
} from '@/features/points/lib/pointListParams'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

/**
 * 코스/지점 — 순찰지점 목록 (`spec 027`).
 *
 * 🔴 **좌/우 마스터-디테일을 걷어냈다**(Phase 1). 행 클릭 → `/points/:pointSeq`.
 * 선택 상태가 URL 로 가면서 022 의 "첫 행 자동 선택" 파생이 함께 사라졌다.
 *
 * 🔴 **검색·필터·페이지는 전부 URL 에 있다**(Phase 4, 022 US5 이월). 새로고침·뒤로가기에
 * 보존되고 링크로 공유된다(`CLAUDE.md` B4). **클라이언트 필터 함수는 0건** — 서버가
 * 전부 거른다(Phase 8 R2 실측: `authMethod=9`→4건 / `useYn=false`→0건 / `searchKey`→6건).
 *
 * 🔴 **`siteSeq` 는 URL 에 노출하지 않는다**(`spec 021` DoD #13) — 선택 결과에서만 온다.
 */

type FilterKey = keyof PointListQuery

const PointsPage = () => {
  const navigate = useNavigate()
  const siteSeq = getSiteSeq()

  const [params, setParams] = useQueryParams<FilterKey>()
  const query: PointListQuery = useMemo(
    () => ({
      search: params.search,
      authMethod: params.authMethod,
      useYn: params.useYn,
      page: params.page,
    }),
    [params.search, params.authMethod, params.useYn, params.page]
  )


  /**
   * 🔴 **행 수는 URL 에 두지 않지만 동작은 한다.** 공유할 상태가 아니라서(필터·페이지와
   * 성격이 다르다) 로컬이되, **컨트롤을 비활성·무동작으로 두지 않는다** — 그게 027 이
   * 고치고 있는 "죽은 버튼" 과 같은 문제다(실제로 한 번 만들었다가 캡쳐에서 잡았다).
   * 행 수를 바꾸면 **첫 페이지로 되돌린다** — 3페이지에서 50개로 바꾸면 범위를 벗어난다.
   */
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const list = usePointList(siteSeq, query, pageSize)
  const items = list.data?.items ?? []

  /**
   * 🔴 **컬럼 정의를 메모이즈한다.** `pointColumns()` 를 렌더마다 호출하면 `cell` 함수의
   * 참조가 매번 바뀌고, `flexRender` 가 그것을 **새 컴포넌트 타입**으로 보아 React 가
   * 행 전체를 언마운트→리마운트한다. 화면은 같아 보이지만 DOM 노드가 교체되므로
   * ① 포커스·선택이 날아가고 ② 재조회마다 깜빡인다.
   */
  const columns = useMemo(() => pointColumns(), [])

  /**
   * 필터·검색 변경.
   *
   * 🔴 **첫 페이지로 되돌린다** — 3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있고,
   * 그러면 **정상 응답인 빈 화면**이 된다(018 선례).
   *
   * 🔴 **히스토리를 쌓는다(`replace` 아님).** 018 은 `replace` 를 썼지만 그 화면은
   * 탭 이동 뒤로가기를 보존하는 것이 목적이었다. 여기서는 **필터를 뒤로가기로 되돌릴 수
   * 있어야 한다** — `replace` 면 필터를 걸고 뒤로가기를 눌렀을 때 **필터 이전이 아니라
   * 아예 이전 화면(`/zones`)으로 튄다**(사용자 확인 2026-10-10). 검색은 300ms 디바운스가
   * 걸려 있어 글자마다 쌓이지 않는다.
   */
  const updateFilter = (next: Partial<Record<FilterKey, string | undefined>>) => {
    setParams({ ...next, page: undefined })
  }

  const pageNumber = parsePageNumber(params.page)
  const hasFilter = Boolean(params.search || params.authMethod || params.useYn)

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="코스/지점" subtitle="순찰 코스와 지점을 구성하고 관리합니다" />

      <CourseTabs />

      <PointTopNav
        search={params.search}
        onSearchChange={(value) => updateFilter({ search: value })}
        filters={
          <PointFilters
            authMethod={params.authMethod}
            useYn={params.useYn}
            onChange={updateFilter}
          />
        }
      />

      {list.isError ? (
        /* 🔴 조회 실패와 0건을 다르게 그린다 — 둘 다 "아무것도 없음" 이면 장애를
           데이터 없음으로 오해해 지점을 새로 만들려 한다(022 승계) */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="지점 목록을 불러오지 못했습니다"
            description={list.error?.message}
          />
          <div className="flex justify-center pb-6">
            <AppButton variant="sub" onClick={() => void list.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : list.isPending ? (
        /**
         * 🔴 **로딩을 "데이터 없음" 으로 보여주지 않는다.** `AppTable` 은 행이 0개면
         * **"데이터가 없습니다"** 를 그리는데, 조회 중에 그것이 뜨면 사용자는 지점이
         * 없다고 믿고 새로 만들려 한다 — 022 가 `PointList` 에서 막아 둔 것을 테이블
         * 전환(Phase 1)에서 놓쳤다(T324 점검에서 발견).
         *
         * 행 높이를 유지해 **로딩 → 목록 전환에서 레이아웃이 튀지 않게** 한다(022 선례).
         */
        <div className="rounded-sm border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
              <div className="h-[22px] animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* 🔴 **필터 0건과 "등록된 지점 없음" 도 다르다.** 필터 때문에 비었는데
           "지점을 추가해주세요" 라고 하면 이미 있는 지점을 또 만들게 된다 */
        <div className="rounded-lg border border-border bg-card">
          {hasFilter ? (
            <>
              <AppEmpty
                icon={FilterXIcon}
                title="조건에 맞는 지점이 없습니다"
                description="검색어나 필터를 바꿔보세요."
              />
              <div className="flex justify-center pb-6">
                <AppButton
                  variant="sub"
                  onClick={() =>
                    setParams({
                      search: undefined,
                      authMethod: undefined,
                      useYn: undefined,
                      page: undefined,
                    })
                  }
                >
                  필터 초기화
                </AppButton>
              </div>
            </>
          ) : (
            <AppEmpty
              icon={MapPinIcon}
              title="등록된 지점이 없습니다."
              description="우측 상단 + 버튼으로 지점을 추가해주세요."
            />
          )}
        </div>
      ) : (
        <>
          <AppTable
            columns={columns}
            data={items}
            hidePagination
            onRowClick={(point) => navigate(paths.service.pointDetail(point.pointSeq))}
            // 🔴 미사용은 **행 전체**를 톤다운한다 — 셀 글자만 흐리면 눈에 안 띈다
            rowClassName={(point) => (point.useYn ? '' : 'bg-muted/40')}
          />

          <AppPagination
            // 🔴 1-based ↔ 0-based 변환은 `lib/pointListParams.ts` 한 자리에서만 한다
            pageIndex={toPageIndex(pageNumber)}
            pageSize={pageSize}
            total={list.data?.totalCount ?? items.length}
            // 🔴 서버 기본값(20)이 옵션에 있어야 셀렉트가 빈 값으로 보이지 않는다
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

export default PointsPage
