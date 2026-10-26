import { useMemo, useState } from 'react'
import { FilterXIcon, RouteIcon, TriangleAlertIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import CourseTabs from '@/features/courses/components/CourseTabs'
import CourseCard from '@/features/courses/components/CourseCard'
import { courseColumns } from '@/features/courses/components/CourseColumn'
import CourseFilters from '@/features/courses/components/CourseFilters'
import CourseTopNav from '@/features/courses/components/CourseTopNav'
import { useCourseList } from '@/features/courses/hooks/useCourseList'
import {
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
  toPageIndex,
  toPageNumber,
  type CourseListQuery,
} from '@/features/courses/lib/courseListParams'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

/**
 * 코스/지점 — 순찰코스 목록 (`spec 023` Phase 2).
 *
 * 🔴 **011 의 mock 셸을 통째로 걷어냈다.** 이전 판은 좌측 트리(`ZoneSideBar`) + 우측
 * 상세 + `ZoneTreeData`(mock) 였고, 서버 타입과 **이름·타입·개수가 전부 달라** 어댑터로
 * 이을 수 없었다(`tasks.md` 제약 1). 선택 상태가 `useState` 라 **새로고침하면 날아가는**
 * 문제도 지점(027)과 같았다 → 행 클릭 → `/zones/:courseSeq`.
 *
 * 🔴 **검색·필터·페이지는 전부 URL 에 있다**(`CLAUDE.md` B4). **클라이언트 필터 함수는
 * 0건** — 서버 파라미터로 나간다. ✅ **실측 확인**(T355, 2026-10-11): `useYn`·`switchYn`·
 * `searchKey`(부분 일치)·`courseStatus` 가 모두 걸리고 조합은 AND 다.
 *
 * 🔴 **`siteSeq` 는 URL 에 노출하지 않는다**(`spec 021` DoD #13).
 */

type FilterKey = keyof CourseListQuery

const ZonesPage = () => {
  const navigate = useNavigate()
  const siteSeq = getSiteSeq()

  const [params, setParams] = useQueryParams<FilterKey>()
  const query: CourseListQuery = useMemo(
    () => ({
      search: params.search,
      useYn: params.useYn,
      switchYn: params.switchYn,
      status: params.status,
      page: params.page,
    }),
    [params.search, params.useYn, params.switchYn, params.status, params.page]
  )

  /**
   * 🔴 **행 수는 URL 에 두지 않지만 동작은 한다**(027 승계). 공유할 상태가 아니라서
   * 로컬이되, 컨트롤을 비활성·무동작으로 두지 않는다. 바꾸면 **첫 페이지로 되돌린다** —
   * 3페이지에서 50개로 바꾸면 범위를 벗어난다.
   */
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const list = useCourseList(siteSeq, query, pageSize)
  const items = list.data?.items ?? []

  /**
   * 🔴 **컬럼 정의를 메모이즈한다.** 렌더마다 `courseColumns()` 를 호출하면 `cell` 함수
   * 참조가 매번 바뀌고, `flexRender` 가 그것을 **새 컴포넌트 타입**으로 보아 React 가
   * 행 전체를 언마운트→리마운트한다 — 화면은 같아 보이지만 포커스가 날아가고 재조회마다
   * 깜빡인다(027 에서 테스트가 "element could not be found" 로 잡아냈다).
   */
  const columns = useMemo(() => courseColumns(), [])

  /**
   * 필터·검색 변경.
   *
   * 🔴 **첫 페이지로 되돌린다** — 3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있고,
   * 그러면 **정상 응답인 빈 화면**이 된다(018 선례).
   *
   * 🔴 **히스토리를 쌓는다(`replace` 아님).** 027 실측: `replace` 면 필터를 걸고 뒤로가기를
   * 눌렀을 때 **필터 이전이 아니라 아예 이전 화면으로 튄다**. 검색은 300ms 디바운스가
   * 걸려 있어 글자마다 쌓이지 않는다.
   */
  const updateFilter = (next: Partial<Record<FilterKey, string | undefined>>) => {
    setParams({ ...next, page: undefined })
  }

  const pageNumber = parsePageNumber(params.page)
  const hasFilter = Boolean(params.search || params.useYn || params.switchYn || params.status)

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="코스/지점" subtitle="순찰 코스와 지점을 구성하고 관리합니다" />

      <CourseTabs />

      <CourseTopNav
        search={params.search}
        onSearchChange={(value) => updateFilter({ search: value })}
        filters={
          <CourseFilters
            useYn={params.useYn}
            switchYn={params.switchYn}
            onChange={updateFilter}
          />
        }
      />

      {list.isError ? (
        /* 🔴 조회 실패와 0건을 다르게 그린다 — 둘 다 "아무것도 없음" 이면 장애를
           데이터 없음으로 오해해 코스를 새로 만들려 한다(022·027 승계) */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="코스 목록을 불러오지 못했습니다"
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
         * **"데이터가 없습니다"** 를 그리는데, 조회 중에 그것이 뜨면 사용자는 코스가
         * 없다고 믿고 새로 만들려 한다 — 027 이 테이블 전환에서 한 번 놓친 퇴행이다.
         * 행 높이를 유지해 로딩 → 목록 전환에서 레이아웃이 튀지 않게 한다.
         */
        <div aria-label="코스 불러오는 중" className="rounded-sm border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
              <div className="h-[22px] animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* 🔴 **필터 0건과 "등록된 코스 없음" 도 다르다.** 필터 때문에 비었는데
           "코스를 추가해주세요" 라고 하면 이미 있는 코스를 또 만들게 된다 */
        <div className="rounded-lg border border-border bg-card">
          {hasFilter ? (
            <>
              <AppEmpty
                icon={FilterXIcon}
                title="조건에 맞는 코스가 없습니다"
                description="검색어나 필터를 바꿔보세요."
              />
              <div className="flex justify-center pb-6">
                <AppButton
                  variant="sub"
                  onClick={() =>
                    setParams({
                      search: undefined,
                      useYn: undefined,
                      switchYn: undefined,
                      status: undefined,
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
              icon={RouteIcon}
              title="등록된 코스가 없습니다"
              description="순찰 코스를 추가해주세요."
            />
          )}
        </div>
      ) : (
        <>
          <AppTable
            columns={columns}
            data={items}
            hidePagination
            // 🔴 `xl` 미만에서는 카드로 — 6컬럼이 좁은 폭에서 찌그러진다(`spec 030`)
            renderCard={CourseCard}
            onRowClick={(course) => navigate(paths.service.courseDetail(course.courseSeq))}
            // 🔴 미사용은 **행 전체**를 톤다운한다 — 셀 글자만 흐리면 눈에 안 띈다(027)
            rowClassName={(course) => (course.useYn ? '' : 'bg-muted/40')}
          />

          <AppPagination
            // 🔴 1-based ↔ 0-based 변환은 `lib/courseListParams.ts` 한 자리에서만 한다
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

export default ZonesPage
