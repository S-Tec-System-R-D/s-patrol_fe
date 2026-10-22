import { useState } from 'react'
import { ArrowLeftRightIcon, FilterIcon, FilterXIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPagination from '@/components/app/AppPagination'
import AppSelect from '@/components/app/AppSelect'
import AssignmentStatusBadge from '@/features/deployments/components/AssignmentStatusBadge'
import { useUserAssignmentHistory } from '@/features/deployments/hooks/useUserAssignmentHistory'
import {
  historyStatusOptions,
  parseHistoryStatus,
  toStatusCode,
  type HistoryStatusFilter,
} from '@/features/deployments/lib/deploymentParams'
import { formatPeriod } from '@/features/deployments/lib/deploymentPeriod'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 근무자의 **배치 이력** (`spec 042` T723 — 038·041 이월 "근무자 상세 배치 이력 카드").
 *
 * `GetAssignmentHistory?userSeq` — 🔴 **사업장과 무관하게 그 사람의 배치 전체**다. 옆의 최근 순찰 기록은
 * 선택 사업장 한정이라 캡션으로 구분한다. 반려된 요청은 서버가 주지 않는다(이력 = 승인된 배치).
 *
 * 상태 뱃지·기간 표기는 배치관리 이력 표와 **같은 것**을 쓴다(`AssignmentStatusBadge` · `formatPeriod`).
 *
 * 🔴 **페이지·상태 필터는 로컬 state** 다 — 상세의 보조 카드라 URL 에 두지 않는다(새로고침하면 처음으로).
 * 상태 필터는 서버가 거른다(042 후속 — `GetAssignmentHistory?status`).
 */

const DEFAULT_PAGE_SIZE = 5

const UserAssignmentCard = ({ userSeq }: { userSeq: number }) => {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [status, setStatus] = useState<HistoryStatusFilter | undefined>()
  const history = useUserAssignmentHistory({
    userSeq,
    status: toStatusCode(status),
    pageNumber: pageIndex + 1,
    pageSize,
  })
  const rows = history.data?.items ?? []

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-panel-title font-bold text-foreground">배치 이력</h3>
          <p className="text-caption text-muted-foreground">전체 사업장 배치 기록</p>
        </div>
        <AppSelect
          aria-label="상태"
          icon={FilterIcon}
          options={historyStatusOptions}
          value={status ?? ALL_VALUE}
          onChange={(value) => {
            setStatus(parseHistoryStatus(value))
            setPageIndex(0)
          }}
          active={Boolean(status)}
          className="w-auto"
        />
      </div>

      {history.isPending ? (
        <div className="h-[120px] animate-pulse rounded-sm bg-muted" />
      ) : history.isError ? (
        /* 🔴 조회 실패를 "이력 없음" 으로 보여주지 않는다 — 이 카드만 실패할 수 있다 */
        <div>
          <AppEmpty
            icon={TriangleAlertIcon}
            title="배치 이력을 불러오지 못했습니다"
            description={history.error?.message}
          />
          <div className="flex justify-center">
            <AppButton variant="sub" onClick={() => void history.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : rows.length === 0 && pageIndex === 0 && status ? (
        /* 🔴 필터 0건과 "기록 없음" 을 다르게 그린다(다른 목록 화면 규약) */
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <FilterXIcon size={20} strokeWidth={1.5} className="text-muted-foreground/50" />
          <p className="text-body font-medium text-foreground">조건에 맞는 배치 이력이 없습니다</p>
          <p className="text-caption text-muted-foreground">상태 필터를 바꿔보세요.</p>
        </div>
      ) : rows.length === 0 && pageIndex === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <ArrowLeftRightIcon size={20} strokeWidth={1.5} className="text-muted-foreground/50" />
          <p className="text-body font-medium text-foreground">배치 이력이 없습니다</p>
          <p className="text-caption text-muted-foreground">
            다른 사업장 배치가 승인되면 여기에 기록됩니다.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col">
            {rows.map((row) => (
              <li
                key={row.assignmentSeq}
                className="flex items-center gap-3 border-b border-border/50 px-1 py-2.5 text-body last:border-0"
              >
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatPeriod(row.startDt, row.endDt)}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {row.siteName}
                </span>
                <AssignmentStatusBadge status={row.status} statusName={row.statusName} />
              </li>
            ))}
          </ul>
          <AppPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={history.data?.totalCount ?? 0}
            pageSizeOptions={[5, 10, 20]}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPageIndex(0)
            }}
          />
        </>
      )}
    </section>
  )
}

export default UserAssignmentCard
