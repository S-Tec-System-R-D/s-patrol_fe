import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRightIcon,
  FilterIcon,
  FilterXIcon,
  InboxIcon,
  RotateCcwIcon,
  SquareArrowRightEnterIcon,
  SquareArrowRightExitIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppIconButton from '@/components/app/AppIconButton'
import AppPagination from '@/components/app/AppPagination'
import AppSelect from '@/components/app/AppSelect'
import AppTable from '@/components/AppTable'
import { parsePageNumber } from '@/features/course-history/lib/courseHistoryListParams'
import { toPageIndex, toPageNumber } from '@/features/courses/lib/courseListParams'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { ALL_VALUE } from '@/lib/listQuery'
import { cn } from '@/lib/utils'
import { useDeploymentHistory } from '../hooks/useDeploymentHistory'
import { useDeploymentRequests } from '../hooks/useDeploymentRequests'
import { useDeploymentSummary } from '../hooks/useDeploymentSummary'
import {
  DEPLOYMENT_PAGE_SIZE,
  historyStatusOptions,
  parseDeploymentTab,
  parseHistoryStatus,
  toHistoryParams,
  toRequestListParams,
  type DeploymentTab,
} from '../lib/deploymentParams'
import { deploymentHistoryColumns } from './DeploymentHistoryColumns'
import { deploymentRequestColumns } from './DeploymentRequestColumns'

/**
 * 배치 요청 · 전출 이력 · 전입 이력 — **탭 3개 + 표 1개** (`spec 039` T649g, 사용자 결정 2026-10-21).
 *
 * 🔴 **섹션 박스 2개(요청 카드 목록 · 이력 탭)를 걷고 다른 목록 화면 틀로 맞췄다** — 헤더 → (KPI) → 탭 →
 * 표 → 페이지네이션. 요청 목록이 표가 되면서(T649e) 세 목록의 공통 칸(근무자 · 경로 · 사유)이 같아졌고,
 * 탭에 따라 **끝 칸만** 바뀐다(요청: 요청일 + 승인/거부 · 이력: 기간 + 상태).
 *
 * 🔴 **기본 탭은 배치 요청**이고 탭에 **대기 건수**를 붙인다 — 014 의 "요청 처리가 이력보다 우선" 을
 * 위치 대신 탭 순서·숫자로 지킨다.
 *
 * 🔴 **활성 탭의 쿼리만 요청한다** — 두 훅을 모두 부르되 안 보는 쪽은 `null`(요청 안 함).
 * 탭은 `?tab`, 페이지는 `?page` 하나(표가 하나다). 탭을 바꾸면 페이지를 지운다.
 */

interface TabDef {
  key: DeploymentTab
  label: string
  icon: LucideIcon
}

const TABS: TabDef[] = [
  { key: 'requests', label: '배치 요청', icon: InboxIcon },
  { key: 'out', label: '전출 이력', icon: SquareArrowRightExitIcon },
  { key: 'in', label: '전입 이력', icon: SquareArrowRightEnterIcon },
]

const EMPTY_TITLE: Record<DeploymentTab, string> = {
  requests: '대기 중인 요청이 없습니다',
  out: '전출 이력이 없습니다',
  in: '전입 이력이 없습니다',
}

const ERROR_TITLE: Record<DeploymentTab, string> = {
  requests: '배치 요청을 불러오지 못했습니다',
  out: '배치 이력을 불러오지 못했습니다',
  in: '배치 이력을 불러오지 못했습니다',
}

const DeploymentBoard = () => {
  const siteSeq = getSiteSeq()
  const [params, setParams] = useQueryParams<'tab' | 'page' | 'status'>()
  const tab = parseDeploymentTab(params.tab)
  /** 이력 상태 필터(T649h) — 요청 탭에서는 쓰지 않는다 */
  const status = tab === 'requests' ? undefined : parseHistoryStatus(params.status)
  const pageNumber = parsePageNumber(params.page)
  /** 행 수는 URL 에 두지 않지만 동작은 한다. 바꾸면 첫 페이지로 */
  const [pageSize, setPageSize] = useState(DEPLOYMENT_PAGE_SIZE)

  const summary = useDeploymentSummary(siteSeq)

  const requestParams = useMemo(
    () =>
      siteSeq === null || tab !== 'requests'
        ? null
        : { ...toRequestListParams(siteSeq, params.page), pageSize },
    [siteSeq, tab, params.page, pageSize]
  )
  const historyParams = useMemo(
    () =>
      siteSeq === null || tab === 'requests'
        ? null
        : { ...toHistoryParams(siteSeq, tab, params.page, status), pageSize },
    [siteSeq, tab, params.page, status, pageSize]
  )
  const requests = useDeploymentRequests(requestParams)
  const history = useDeploymentHistory(historyParams)
  const active = tab === 'requests' ? requests : history
  const items = active.data?.items ?? []

  /** 🔴 메모이즈한다 — 렌더마다 만들면 행(과 그 안의 mutation 상태)이 리마운트된다(027) */
  const requestColumns = useMemo(
    () => (siteSeq === null ? [] : deploymentRequestColumns(siteSeq)),
    [siteSeq]
  )
  const historyColumns = useMemo(() => deploymentHistoryColumns(), [])

  /**
   * 🔴 **마지막 요청을 처리해 현재 페이지가 비면 이전 페이지로**(spec §4) — 2페이지의 유일한 요청을
   * 승인하면 무효화 뒤 **정상 응답인 빈 페이지**가 되고, 사용자는 요청이 다 없어진 줄 안다.
   */
  const pageEmptied = active.isSuccess && items.length === 0 && pageNumber > 1
  useEffect(() => {
    if (pageEmptied) {
      setParams({ page: pageNumber - 1 > 1 ? String(pageNumber - 1) : undefined }, { replace: true })
    }
  }, [pageEmptied, pageNumber, setParams])

  /** 🔴 탭을 바꾸면 페이지·상태 필터를 지운다 — 다른 탭에 끌고 가면 일부만 보이는 이유를 모른다 */
  const selectTab = (next: DeploymentTab) =>
    setParams({ tab: next === 'requests' ? undefined : next, page: undefined, status: undefined })

  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 탭 — 순찰이력(`PatrolHistoryTabs`)·코스/지점과 같은 밑줄형(사용자 결정 2026-10-21).
          라우트가 아니라 쿼리(`?tab`)를 바꾸므로 링크가 아니라 **탭 버튼**이다 */}
      <div role="tablist" aria-label="배치 목록" className="flex items-center gap-1 border-b border-border">
        {TABS.map(({ key, label, icon: Icon }) => {
          const selected = tab === key
          const pending = key === 'requests' ? summary.data?.pendingCount : undefined
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-tab font-semibold text-muted-foreground transition-colors hover:text-foreground',
                selected && 'border-point font-bold text-foreground'
              )}
            >
              <Icon size={14} strokeWidth={1.75} />
              {label}
              {/* 🔴 대기 건수 — 0 이거나 모르면 그리지 않는다(숫자를 지어내지 않는다) */}
              {!!pending && (
                <span className="rounded-full bg-warning-bg px-1.5 text-label font-semibold text-warning-foreground">
                  {pending}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 이력 탭의 필터 줄 — 다른 목록 화면과 같은 자리·모양(필터 → 초기화).
          🔴 KPI(지금 나가/와 있는 **인원**)를 누르면 `배치중` 으로 걸려서 온다 — 숫자와 행 수가 맞는다(T649h) */}
      {tab !== 'requests' && (
        <div role="group" aria-label="목록 필터" className="flex items-center gap-2">
          <AppSelect
            aria-label="상태"
            icon={FilterIcon}
            options={historyStatusOptions}
            value={status ?? ALL_VALUE}
            onChange={(value) =>
              setParams({ status: value === ALL_VALUE ? undefined : value, page: undefined })
            }
            active={Boolean(status)}
            className="w-auto"
          />
          {status && (
            <AppIconButton
              icon={RotateCcwIcon}
              aria-label="필터 초기화"
              title="필터 초기화"
              onClick={() => setParams({ status: undefined, page: undefined })}
              className="bg-card"
            />
          )}
        </div>
      )}

      {active.isError ? (
        /* 🔴 조회 실패를 "없음" 으로 보여주지 않는다 — 처리할 요청을 놓친다 */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty icon={TriangleAlertIcon} title={ERROR_TITLE[tab]} description={active.error?.message} />
          <div className="flex justify-center pb-6">
            <AppButton variant="sub" onClick={() => void active.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : active.isPending || pageEmptied ? (
        <div className="rounded-sm border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-b border-border/50 px-3 py-3 last:border-0">
              <div className="h-[22px] animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          {/* 🔴 필터 0건과 "기록 없음" 을 다르게 그린다(다른 목록 화면 규약) */}
          {status ? (
            <AppEmpty
              icon={FilterXIcon}
              title="조건에 맞는 이력이 없습니다"
              description="상태 필터를 바꿔보세요."
            />
          ) : (
            <AppEmpty
              icon={tab === 'requests' ? InboxIcon : ArrowLeftRightIcon}
              title={EMPTY_TITLE[tab]}
            />
          )}
        </div>
      ) : (
        <>
          {/* 🔴 `hidePagination` 은 `manualPagination` 을 함께 건다 — 클라이언트 페이징을 끈다.
              ⚠️ `key` 로 탭마다 표를 새로 만든다 — 컬럼 집합이 다른 표를 같은 인스턴스로 갈아 끼우지 않는다 */}
          {tab === 'requests' ? (
            <AppTable key="requests" columns={requestColumns} data={requests.data?.items ?? []} hidePagination />
          ) : (
            <AppTable key={tab} columns={historyColumns} data={history.data?.items ?? []} hidePagination />
          )}
          <AppPagination
            pageIndex={toPageIndex(pageNumber)}
            pageSize={pageSize}
            total={active.data?.totalCount ?? items.length}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={(pageIndex) => {
              const next = toPageNumber(pageIndex)
              setParams({ page: next > 1 ? String(next) : undefined })
            }}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setParams({ page: undefined })
            }}
          />
        </>
      )}
    </div>
  )
}

export default DeploymentBoard
