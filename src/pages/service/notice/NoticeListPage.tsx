import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilterXIcon, MegaphoneIcon, PlusIcon, RotateCcwIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDatePicker from '@/components/app/AppDatePicker'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppInput from '@/components/app/AppInput'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import {
  DEFAULT_PAGE_SIZE,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import { toDateQuery } from '@/features/course-history/lib/historyRange'
import { toPageIndex, toPageNumber } from '@/features/courses/lib/courseListParams'
import NoticeCard from '@/features/notice/components/NoticeCard'
import { noticeColumns } from '@/features/notice/components/NoticeColumn'
import NoticeForm from '@/features/notice/form/NoticeForm'
import { useNoticeList } from '@/features/notice/hooks/useNoticeList'
import { toNoticeListParams, type NoticeQuery } from '@/features/notice/lib/noticeListParams'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

/**
 * 공지사항 목록 (`spec 026` US1).
 *
 * 🔴 **리스트형에서 테이블로 바꿨다**(사용자 결정 2026-10-20) — 015 는 목업이 없어 리스트
 * 아이템으로 만들었지만, 그 뒤 순찰이력·코스/지점이 테이블 + 필터 바로 자리 잡으면서 공지만
 * 다른 화면처럼 읽혔다. 골격은 037 `PatrolPointsPage` 와 같다.
 *
 * 🔴 **필터·검색·페이지는 전부 URL 에 있고 서버 파라미터로 나간다**(클라이언트 필터 0건).
 * `siteSeq` 는 URL 에 두지 않는다(`spec 021` DoD #13).
 *
 * 작성은 모달 → `AddNotice`(`spec 040`). 성공해야 닫히고 목록에 머문다(서버가 ID 를 주지 않는다).
 */

type FilterKey = keyof NoticeQuery
const SEARCH_DEBOUNCE_MS = 300

const NoticeListPage = () => {
  const navigate = useNavigate()
  const siteSeq = getSiteSeq()

  const [params, setParams] = useQueryParams<FilterKey>()
  const query: NoticeQuery = useMemo(
    () => ({ q: params.q, from: params.from, to: params.to, page: params.page, size: params.size }),
    [params.q, params.from, params.to, params.page, params.size]
  )

  /** 🔴 행 수는 URL 에 두지 않지만 동작은 한다(027·036·037 승계). 바꾸면 첫 페이지로 */
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [createOpen, setCreateOpen] = useState(false)

  const listParams = useMemo(
    () => (siteSeq === null ? null : { ...toNoticeListParams(siteSeq, query), pageSize }),
    [siteSeq, query, pageSize]
  )
  const list = useNoticeList(listParams)
  const items = list.data?.items ?? []

  /** 🔴 메모이즈한다 — 렌더마다 만들면 행이 리마운트되어 포커스가 날아간다(027) */
  const columns = useMemo(() => noticeColumns(), [])

  /**
   * 🔴 필터를 바꾸면 **첫 페이지로** 되돌린다 — 3페이지에서 거르면 정상 응답인 빈 화면이 된다.
   * 🔴 `replace` 가 아니다 — 뒤로가기가 필터 이전으로 가야 한다(027 실측).
   */
  const updateFilter = (next: Partial<Record<FilterKey, string | undefined>>) => {
    setParams({ ...next, page: undefined })
  }

  /**
   * 🔴 입력은 로컬 state, URL 은 디바운스 뒤에(027 규약). URL 이 밖에서 바뀌면(뒤로가기·
   * 초기화) 입력창을 맞춘다 — effect 가 아니라 **렌더 중 조정**이다.
   *
   * 🔴 **"제목·내용 검색"** 이다 — 서버 `keyword` 는 제목 + 본문을 거르고 **작성자는 거르지
   * 않는다**(실측 2026-10-20). 구 목록의 "제목 또는 작성자 검색" 을 그대로 두면 이름을 넣고
   * 0건을 받는다(037 OQ-037-B 와 같은 종류).
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
  const hasFilter = Boolean(params.q || params.from || params.to)
  const resetFilters = () =>
    setParams({ q: undefined, from: undefined, to: undefined, page: undefined })

  const range = useMemo(
    () => ({
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
    }),
    [params.from, params.to]
  )

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="공지사항" subtitle="근무자에게 전달할 공지를 관리합니다" />

      {/* 🔴 037 과 같은 한 줄 배치 — 검색이 맨 앞, 필터가 뒤, 남는 폭은 spacer.
          🔴 필터 영역에만 이름을 붙인다(`spec 030` — 카드 `button` 과 이름이 겹친다) */}
      <div className="flex items-center gap-2">
        <AppInput
          variant="search"
          placeholder="제목·내용 검색"
          aria-label="제목·내용 검색"
          className="w-[260px]"
          value={keywordDraft}
          onChange={(event) => {
            setKeywordDraft(event.target.value)
            pushKeyword(event.target.value)
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
        {/* 🔴 **생성 버튼은 필터 줄 끝**이다 — 코스/지점(`PointTopNav`)과 같은 자리·모양.
            헤더 액션에 두면 화면마다 "만들기" 위치가 달라진다(사용자 요청 2026-10-20) */}
        <AppDialog
          title="공지 작성"
          description="근무자에게 전달할 공지를 작성합니다."
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            /* 🔴 `xl` 미만에서는 아이콘만 — `aria-label` 로 이름을 유지한다(`PointTopNav` 승계) */
            <AppButton
              icon={PlusIcon}
              iconSize={14}
              aria-label="공지 작성"
              // 사업장이 없으면 목록도 요청하지 않는다 — 같은 기준으로 막는다
              disabled={siteSeq === null}
              className="h-9 px-3 xl:px-4 border-transparent bg-point-bg text-point-foreground hover:bg-point/20"
            >
              <span className="hidden xl:inline">공지 작성</span>
            </AppButton>
          }
        >
          <NoticeForm onSuccess={() => setCreateOpen(false)} />
        </AppDialog>
      </div>

      {list.isError ? (
        /* 🔴 조회 실패와 0건을 다르게 그린다 — 장애를 "공지 없음" 으로 오해한다 */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="공지사항을 불러오지 못했습니다"
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
        <div className="rounded-sm border border-border bg-card">
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
              title="조건에 맞는 공지가 없습니다"
              description="검색어나 기간을 바꿔보세요."
            />
          ) : (
            <AppEmpty
              icon={MegaphoneIcon}
              title="등록된 공지가 없습니다"
              description="공지를 작성하면 여기에 표시됩니다."
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
            renderCard={NoticeCard}
            // 🔴 고정 공지는 **행 전체**를 칠한다 — 핀 아이콘 하나로는 훑어볼 때 잘 안 보인다
            //    (사용자 요청 2026-10-20). 셀 단위로 칠하면 배경이 끊긴다(027 톤다운과 같은 이유)
            rowClassName={(notice) => (notice.isPin ? 'bg-point-bg/50' : '')}
            onRowClick={(row) => navigate(paths.service.noticeDetail(row.noticeSeq))}
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

export default NoticeListPage
