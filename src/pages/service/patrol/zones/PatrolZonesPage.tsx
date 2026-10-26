import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilterIcon,
  FilterXIcon,
  HistoryIcon,
  LayoutListIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDatePicker from '@/components/app/AppDatePicker'
import AppEmpty from '@/components/app/AppEmpty'
import AppInput from '@/components/app/AppInput'
import AppIconButton from '@/components/app/AppIconButton'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppSelect from '@/components/app/AppSelect'
import AppTable from '@/components/AppTable'
import { useCourseHistoryList } from '@/features/course-history/hooks/useCourseHistoryList'
import { toDateQuery } from '@/features/course-history/lib/historyRange'
import {
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
  toCourseHistoryListParams,
  type CourseHistoryQuery,
} from '@/features/course-history/lib/courseHistoryListParams'
import { useCourseList } from '@/features/courses/hooks/useCourseList'
import PatrolHistoryTabs from '@/features/patrol-zones/components/PatrolHistoryTabs'
import ZoneHistoryCard from '@/features/patrol-zones/components/ZoneHistoryCard'
import { zoneHistoryColumns } from '@/features/patrol-zones/components/ZoneColumn'
import {
  courseFilterOptions,
  resultFilterOptions,
} from '@/features/patrol-zones/lib/courseHistoryFilters'
import { toPageIndex, toPageNumber } from '@/features/courses/lib/courseListParams'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { ALL_VALUE } from '@/lib/listQuery'
import { paths } from '@/router/paths'

/**
 * 순찰이력 — 코스 순찰이력 목록 (`spec 036` Phase 3).
 *
 * 🔴 **mock 셸을 통째로 걷어냈다.** 이전 판은 페이지 안에 **이력 24건이 배열로 박혀
 * 있었고**(`zonePatrols`, 215~586행) 필터도 클라이언트 함수(`filterCourseHistory`)였다.
 * 서버 타입과 **이름·타입·개수가 전부 달라** 어댑터로 이을 수 없었다(023 이 코스 목록에서
 * 한 것과 같은 전환).
 *
 * 🔴 **마스터-디테일을 버렸다.** 우측 상세 패널(`PatrolDetailPanel`) 대신
 * **`/patrol/zones/:historySeq` 별 페이지**로 간다 — 선택 상태가 `useState` 라
 * **새로고침하면 날아갔고**, 목업(`01`·`02`)도 목록/상세 2화면이다. 027(지점)·023(코스)이
 * 이미 같은 전환을 했다.
 *
 * 🔴 **필터·검색·페이지는 전부 URL 에 있고 서버 파라미터로 나간다**(`CLAUDE.md` B4).
 * **클라이언트 필터 함수는 0건.**
 *
 * 🔴 **`siteSeq` 는 URL 에 노출하지 않는다**(`spec 021` DoD #13) — 서버가 권한을 검사하지
 * 않으므로(B-9) 사용자가 고칠 수 있는 자리에 두면 남의 사업장 이력이 열린다.
 */

type FilterKey = keyof CourseHistoryQuery
const SEARCH_DEBOUNCE_MS = 300
/** 코스 필터 옵션을 한 번에 받는 수. 🔴 서버 `pageSize` 상한이 100 이다 */
const COURSE_OPTION_PAGE_SIZE = 100

const PatrolZonesPage = () => {
  const navigate = useNavigate()
  const siteSeq = getSiteSeq()

  const [params, setParams] = useQueryParams<FilterKey>()
  const query: CourseHistoryQuery = useMemo(
    () => ({
      from: params.from,
      to: params.to,
      course: params.course,
      result: params.result,
      user: params.user,
      page: params.page,
      size: params.size,
    }),
    [params.from, params.to, params.course, params.result, params.user, params.page, params.size]
  )

  /**
   * 🔴 **행 수는 URL 에 두지 않지만 동작은 한다**(027·023 승계). 공유할 상태가 아니라서
   * 로컬이되, 컨트롤을 비활성·무동작으로 두지 않는다. 바꾸면 **첫 페이지로 되돌린다**.
   */
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const listParams = useMemo(
    () =>
      siteSeq === null
        ? null
        : { ...toCourseHistoryListParams(siteSeq, query), pageSize },
    [siteSeq, query, pageSize]
  )
  const list = useCourseHistoryList(listParams)
  const items = list.data?.items ?? []

  /**
   * 코스 필터 옵션.
   *
   * 🔴 **이전 판은 mock 행에서 코스 이름을 모았다** — 서버 목록에서는 그렇게 할 수 없다
   * (현재 페이지에 없는 코스가 필터에서 사라진다). 사업장의 코스 목록을 따로 받는다.
   */
  const courses = useCourseList(siteSeq, {}, COURSE_OPTION_PAGE_SIZE)
  const courseOptions = useMemo(
    () => courseFilterOptions(courses.data?.items ?? []),
    [courses.data?.items]
  )

  /**
   * 🔴 **컬럼 정의를 메모이즈한다.** 렌더마다 만들면 `cell` 함수 참조가 바뀌고
   * `flexRender` 가 **새 컴포넌트 타입**으로 보아 행이 언마운트→리마운트된다 — 화면은
   * 같아 보이지만 포커스가 날아가고 재조회마다 깜빡인다(027 에서 테스트가 잡아냈다).
   */
  const columns = useMemo(() => zoneHistoryColumns(), [])

  /**
   * 필터·검색 변경.
   *
   * 🔴 **첫 페이지로 되돌린다** — 3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있고,
   * 그러면 **정상 응답인 빈 화면**이 된다(018 선례).
   *
   * 🔴 **히스토리를 쌓는다(`replace` 아님).** 이전 판은 `replace: true` 였는데 **027
   * 실측에서 그게 문제였다**: `replace` 면 필터를 걸고 뒤로가기를 눌렀을 때 **필터 이전이
   * 아니라 아예 이전 화면으로 튄다.** 검색은 디바운스가 걸려 글자마다 쌓이지 않는다.
   */
  const updateFilter = (next: Partial<Record<FilterKey, string | undefined>>) => {
    setParams({ ...next, page: undefined })
  }

  /** 🔴 "전체" 는 값이 아니라 **해제**다 — URL·서버 파라미터에서 키를 지운다 */
  const selectValue = (value: string) => (value === ALL_VALUE ? undefined : value)

  /**
   * 순찰자 검색.
   *
   * 🔴 **드롭다운이 아니다.** 현장 계정은 `User/W/sign/UserList` 가 **403** 이라 순찰자
   * 선택 목록을 받을 수 없다(백엔드에 목록 API 를 요청해 둔 상태). 서버는 `userName`
   * **부분 문자열**을 받으므로 텍스트 입력으로 간다.
   *
   * 🔴 **입력은 로컬 state, URL 은 디바운스 뒤에**(027 규약) — URL 을 바로 쓰면 글자마다
   * 내비게이션이 걸려 입력이 끊긴다. 반대로 **URL 이 밖에서 바뀌면**(뒤로가기·초기화)
   * 입력창을 맞춘다. effect 가 아니라 **렌더 중 조정**이다(`react-hooks/set-state-in-effect`).
   */
  const [userDraft, setUserDraft] = useState(params.user ?? '')
  const [lastUser, setLastUser] = useState(params.user)
  if (params.user !== lastUser) {
    setLastUser(params.user)
    setUserDraft(params.user ?? '')
  }
  const pushUser = useDebouncedCallback(
    (value: string) => updateFilter({ user: value.trim() || undefined }),
    SEARCH_DEBOUNCE_MS
  )

  const pageNumber = parsePageNumber(params.page)
  const hasFilter = Boolean(
    params.from || params.to || params.course || params.result || params.user
  )
  const resetFilters = () =>
    setParams({
      from: undefined,
      to: undefined,
      course: undefined,
      result: undefined,
      user: undefined,
      page: undefined,
    })

  const range = useMemo(
    () => ({
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    }),
    [params.from, params.to]
  )

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="순찰이력" subtitle="코스·지점 단위 순찰 수행 이력을 확인합니다" />

      <PatrolHistoryTabs />

      {/**
        * 🔴 **한 줄로 둔다**(사용자 확인 2026-10-16) — 검색과 필터가 2열로 접히면
        * "검색은 필터와 다른 것" 처럼 보였다. **코스/지점 관리(`CourseTopNav`)와 같은
        * 배치**다: 검색이 맨 앞, 필터가 뒤, 남는 폭은 spacer 가 먹는다.
        *
        * 🔴 **필터 영역에만 이름을 붙인다**(`spec 030`) — 좁은 폭 카드가 `button` 이라
        * 접근성 이름에 행 내용이 전부 들어가고 필터 버튼과 이름이 겹친다. 검색은 자기
        * `aria-label` 이 있어 그룹 밖에 둔다(`CourseTopNav` 와 같다).
        * ⚠️ `contents` 라 그룹이 **flex 줄을 끊지 않는다.**
        */}
      <div className="flex items-center gap-2">
        <AppInput
          variant="search"
          placeholder="순찰자 검색"
          aria-label="순찰자 검색"
          className="w-[260px]"
          value={userDraft}
          onChange={(event) => {
            setUserDraft(event.target.value)
            pushUser(event.target.value)
          }}
        />
        <div role="group" aria-label="목록 필터" className="contents">
          <AppDatePicker
            value={range}
            onChange={(next) =>
              updateFilter({
                from: next.from ? toDateQuery(next.from) : undefined,
                to: next.to ? toDateQuery(next.to) : undefined,
              })
            }
            active={Boolean(params.from)}
            className="w-auto"
          />
          <AppSelect
            aria-label="코스"
            icon={LayoutListIcon}
            options={courseOptions}
            value={params.course ?? ALL_VALUE}
            onChange={(value) => updateFilter({ course: selectValue(value) })}
            active={Boolean(params.course)}
            className="w-auto"
          />
          <AppSelect
            aria-label="결과"
            icon={FilterIcon}
            options={resultFilterOptions}
            value={params.result ?? ALL_VALUE}
            onChange={(value) => updateFilter({ result: selectValue(value) })}
            active={Boolean(params.result)}
            className="w-auto"
          />
          {/* 🔴 **아이콘 버튼으로 둔다**(사용자 결정 2026-10-16) — 글자 버튼이 필터
              컨트롤들과 같은 무게로 보여 "네 번째 필터" 처럼 읽혔다. 🔴 `aria-label` 은
              남긴다(아이콘만 있는 버튼은 이름이 없으면 스크린리더에서 사라진다) */}
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
      </div>

      {list.isError ? (
        /* 🔴 조회 실패와 0건을 다르게 그린다 — 둘 다 "아무것도 없음" 이면 장애를
           **데이터 없음**으로 오해한다(022·027·023 승계) */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="순찰이력을 불러오지 못했습니다"
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
         * "데이터가 없습니다" 를 그리는데, 조회 중에 그것이 뜨면 사용자는 순찰이 없었다고
         * 믿는다. 행 높이를 유지해 로딩 → 목록 전환에서 레이아웃이 튀지 않게 한다.
         */
        <div aria-label="순찰이력 불러오는 중" className="rounded-sm border border-border bg-card">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
              <div className="h-[22px] animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* 🔴 **필터 0건과 "이력 없음" 도 다르다.** 필터 때문에 비었는데 "아직 순찰이
           없습니다" 라고 하면 사용자는 데이터가 없다고 믿는다 */
        <div className="rounded-lg border border-border bg-card">
          {hasFilter ? (
            /* 🔴 **빈 상태에 초기화 버튼을 두지 않는다**(사용자 결정 2026-10-16) —
               바로 위 필터 바에 초기화 아이콘이 **항상 보이는 자리**에 있어 같은 버튼이
               두 개가 된다. 023 은 그 아이콘이 없어서 여기에 뒀던 것이다 */
            <AppEmpty
              icon={FilterXIcon}
              title="조건에 맞는 순찰이력이 없습니다"
              description="기간이나 필터를 바꿔보세요."
            />
          ) : (
            <AppEmpty
              icon={HistoryIcon}
              title="순찰이력이 없습니다"
              description="순찰이 수행되면 여기에 기록됩니다."
            />
          )}
        </div>
      ) : (
        <>
          <AppTable
            columns={columns}
            data={items}
            hidePagination
            // 🔴 `xl` 미만에서는 카드로 — 8컬럼이 좁은 폭에서 찌그러진다(`spec 030`)
            renderCard={ZoneHistoryCard}
            onRowClick={(row) => navigate(paths.service.patrolZoneDetail(row.historySeq))}
          />

          <AppPagination
            // 🔴 1-based ↔ 0-based 변환은 `courseListParams.ts` 한 자리에서만 한다
            pageIndex={toPageIndex(pageNumber)}
            pageSize={pageSize}
            total={list.data?.totalCount ?? items.length}
            // 🔴 **100 을 넘기지 않는다** — 서버 상한이다(넘기면 400 + 빈 화면)
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

export default PatrolZonesPage
