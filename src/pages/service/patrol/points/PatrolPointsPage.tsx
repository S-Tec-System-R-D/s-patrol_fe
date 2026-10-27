import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilterIcon,
  FilterXIcon,
  HistoryIcon,
  LayoutListIcon,
  RotateCcwIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDatePicker from '@/components/app/AppDatePicker'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppInput from '@/components/app/AppInput'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppSelect from '@/components/app/AppSelect'
import AppTable from '@/components/AppTable'
import { usePointHistoryList } from '@/features/course-history/hooks/usePointHistoryList'
import {
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
  toPointHistoryListParams,
  type PointHistoryQuery,
} from '@/features/course-history/lib/pointHistoryListParams'
import { toDateQuery } from '@/features/course-history/lib/historyRange'
import { useCourseList } from '@/features/courses/hooks/useCourseList'
import { toPageIndex, toPageNumber } from '@/features/courses/lib/courseListParams'
import PointHistoryCard from '@/features/patrol-points/components/PointHistoryCard'
import { pointHistoryColumns } from '@/features/patrol-points/components/PointColumn'
import {
  authMethodFilterOptions,
  pointResultFilterOptions,
} from '@/features/patrol-points/lib/pointHistoryFilters'
import PatrolHistoryTabs from '@/features/patrol-zones/components/PatrolHistoryTabs'
import { courseFilterOptions } from '@/features/patrol-zones/lib/courseHistoryFilters'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { ALL_VALUE } from '@/lib/listQuery'
import { paths } from '@/router/paths'

/**
 * 순찰이력 — 지점 순찰이력 목록 (`spec 037` Phase 3).
 *
 * 🔴 **mock 셸을 통째로 걷어냈다.** 이전 판은 페이지 안에 이력 12건이 배열로 박혀 있었고
 * (`pointPatrols`, 103~235행) 결과 enum(`PATROL_POINT_RESULT`)과 타입(`PointPatrolType`)도
 * 이 파일에서 export 해 컬럼·카드가 그것을 import 했다 — 036 이 해소한 **enum 3중 분기**가
 * 바로 이런 모양이었다. 지금은 서버 타입 하나(`PointHistoryRow`)와 뱃지 단일 출처
 * (`historyBadge.ts`)만 쓴다.
 *
 * 🔴 **036 `PatrolZonesPage` 와 같은 골격이다.** 이력 2화면이 탭으로 나란히 있어
 * 필터 배치·빈 상태·페이지네이션이 갈리면 탭을 옮길 때마다 다른 화면처럼 읽힌다.
 *
 * 🔴 **필터·검색·페이지는 전부 URL 에 있고 서버 파라미터로 나간다.** **클라이언트 필터
 * 함수는 0건** — 서버가 필터·페이징을 모두 제공한다(018 이 보류한 지점 필터의 종결점).
 *
 * 🔴 **`siteSeq` 는 URL 에 노출하지 않는다**(`spec 021` DoD #13) — 서버가 권한을 검사하지
 * 않으므로(B-9) 사용자가 고칠 수 있는 자리에 두면 남의 사업장 이력이 열린다.
 *
 * 🔴 **내보내기 버튼을 두지 않는다** — Excel/PDF **엔드포인트가 없다**(swagger 전수).
 * 036 이 코스 쪽에서 같은 판단을 했다. 누르면 아무 일도 없는 버튼은 **자리 차지**다.
 */

type FilterKey = keyof PointHistoryQuery
const SEARCH_DEBOUNCE_MS = 300
/** 코스 필터 옵션을 한 번에 받는 수. 🔴 서버 `pageSize` 상한이 100 이다 */
const COURSE_OPTION_PAGE_SIZE = 100

const PatrolPointsPage = () => {
  const navigate = useNavigate()
  const siteSeq = getSiteSeq()

  const [params, setParams] = useQueryParams<FilterKey>()
  const query: PointHistoryQuery = useMemo(
    () => ({
      from: params.from,
      to: params.to,
      course: params.course,
      auth: params.auth,
      result: params.result,
      user: params.user,
      page: params.page,
      size: params.size,
    }),
    [
      params.from,
      params.to,
      params.course,
      params.auth,
      params.result,
      params.user,
      params.page,
      params.size,
    ]
  )

  /**
   * 🔴 **행 수는 URL 에 두지 않지만 동작은 한다**(027·023·036 승계). 공유할 상태가 아니라서
   * 로컬이되, 컨트롤을 비활성·무동작으로 두지 않는다. 바꾸면 **첫 페이지로 되돌린다**.
   */
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const listParams = useMemo(
    () => (siteSeq === null ? null : { ...toPointHistoryListParams(siteSeq, query), pageSize }),
    [siteSeq, query, pageSize]
  )
  const list = usePointHistoryList(listParams)
  const items = list.data?.items ?? []

  /**
   * 코스 필터 옵션 — **사업장의 코스 목록**에서 만든다.
   *
   * 🔴 **이력 행에서 모으지 않는다** — 서버 페이징이라 현재 페이지에 없는 코스가 필터에서
   * 사라진다(036 이 코스 쪽에서 같은 전환을 했다).
   */
  const courses = useCourseList(siteSeq, {}, COURSE_OPTION_PAGE_SIZE)
  const courseOptions = useMemo(
    () => courseFilterOptions(courses.data?.items ?? []),
    [courses.data?.items]
  )

  /**
   * 🔴 **컬럼 정의를 메모이즈한다.** 렌더마다 만들면 `cell` 함수 참조가 바뀌고 `flexRender`
   * 가 **새 컴포넌트 타입**으로 보아 행이 언마운트→리마운트된다 — 화면은 같아 보이지만
   * 포커스가 날아가고 재조회마다 깜빡인다(027 에서 테스트가 잡아냈다).
   */
  const columns = useMemo(() => pointHistoryColumns(), [])

  /**
   * 필터·검색 변경.
   *
   * 🔴 **첫 페이지로 되돌린다** — 3페이지에서 필터를 걸면 결과가 1페이지뿐일 수 있고,
   * 그러면 **정상 응답인 빈 화면**이 된다(018 선례).
   * 🔴 **히스토리를 쌓는다(`replace` 아님)** — `replace` 면 필터를 걸고 뒤로가기를 눌렀을 때
   * 필터 이전이 아니라 **아예 이전 화면으로 튄다**(027 실측).
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
   * 선택 목록을 받을 수 없다. 서버는 `userName` **부분 문자열**을 받는다.
   *
   * 🔴 **목업의 "지점명 · 순찰자 검색" 에서 지점명을 뺐다**(사용자 결정 2026-10-19) —
   * 서버는 지점을 `pointSeq` **정수**로만 받아 **텍스트 검색이 불가능**하다. 못 하는 것을
   * placeholder 에 적으면 입력해 보고 0건을 받는다(OQ-037-B).
   *
   * 🔴 **입력은 로컬 state, URL 은 디바운스 뒤에**(027 규약). 반대로 **URL 이 밖에서
   * 바뀌면**(뒤로가기·초기화) 입력창을 맞춘다 — effect 가 아니라 **렌더 중 조정**이다.
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
    params.from || params.to || params.course || params.auth || params.result || params.user
  )
  const resetFilters = () =>
    setParams({
      from: undefined,
      to: undefined,
      course: undefined,
      auth: undefined,
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
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <AppPageHeader title="순찰이력" subtitle="코스·지점 단위 순찰 수행 이력을 확인합니다" />

      <PatrolHistoryTabs />

      {/* 🔴 **한 줄로 둔다**(036 과 같은 배치) — 검색이 맨 앞, 필터가 뒤, 남는 폭은 spacer.
          🔴 **필터 영역에만 이름을 붙인다**(`spec 030`) — 좁은 폭 카드가 `button` 이라
          접근성 이름에 행 내용이 전부 들어가고 필터 버튼과 이름이 겹친다.
          ⚠️ `contents` 라 그룹이 flex 줄을 끊지 않는다 */}
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
        <AppInput
          variant="search"
          placeholder="순찰자 검색"
          aria-label="순찰자 검색"
          className="w-full xl:w-[260px]"
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
            aria-label="인증수단"
            icon={SmartphoneIcon}
            options={authMethodFilterOptions}
            value={params.auth ?? ALL_VALUE}
            onChange={(value) => updateFilter({ auth: selectValue(value) })}
            active={Boolean(params.auth)}
            className="w-auto"
          />
          <AppSelect
            aria-label="결과"
            icon={FilterIcon}
            options={pointResultFilterOptions}
            value={params.result ?? ALL_VALUE}
            onChange={(value) => updateFilter({ result: selectValue(value) })}
            active={Boolean(params.result)}
            className="w-auto"
          />
          {/* 🔴 **아이콘 버튼**이다(036 결정) — 글자 버튼이 필터 컨트롤과 같은 무게로 보여
              "다섯 번째 필터" 처럼 읽혔다. `aria-label` 은 남긴다 */}
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
           **데이터 없음**으로 오해한다(022·027·023·036 승계) */
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
        /* 🔴 **로딩을 "데이터 없음" 으로 보여주지 않는다.** `AppTable` 은 행이 0개면
           "데이터가 없습니다" 를 그리는데, 조회 중에 그것이 뜨면 사용자는 순찰이 없었다고
           믿는다 */
        <div aria-label="인증 기록 불러오는 중" className="rounded-sm border border-border bg-card">
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
              title="조건에 맞는 인증 기록이 없습니다"
              description="기간이나 필터를 바꿔보세요."
            />
          ) : (
            /* 🔴 **"없다" 로 단정하지 않는다.** 이 응답은 `checkDt` 가 있는 행만 주므로
               (`api-spec.md` §4) 방문 기록이 없는 미완료는 애초에 오지 않는다 — "순찰이
               없었다" 가 아니라 **인증 기록이 아직 없다**가 사실이다 */
            <AppEmpty
              icon={HistoryIcon}
              title="인증 기록이 없습니다"
              description="지점 인증이 이뤄지면 여기에 기록됩니다."
            />
          )}
        </div>
      ) : (
        <>
          <AppTable
            columns={columns}
            data={items}
            // 🔴 `hidePagination` 은 "페이징의 주인이 화면" 이라는 선언이다 — `AppTable` 이
            //    `manualPagination` 을 함께 걸어 **클라이언트 페이징을 끈다**(2026-10-19 교정).
            //    이 화면도 그 교정 대상 3곳 중 하나였다
            hidePagination
            // 🔴 `xl` 미만에서는 카드로 — 8컬럼이라 이 화면이 가장 심하게 찌그러진다(030)
            renderCard={PointHistoryCard}
            onRowClick={(row) => navigate(paths.service.patrolPointDetail(row.detailSeq))}
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

export default PatrolPointsPage
