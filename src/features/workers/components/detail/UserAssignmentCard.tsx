import { useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppLinkButton from '@/components/app/AppLinkButton'
import AssignmentStatusBadge from '@/features/deployments/components/AssignmentStatusBadge'
import { useUserAssignmentHistory } from '@/features/deployments/hooks/useUserAssignmentHistory'
import { formatPeriod } from '@/features/deployments/lib/deploymentPeriod'
import {
  ASSIGNMENT_STATUS,
  type UserAssignmentHistoryRow,
} from '@/features/deployments/types/deployment'

/**
 * 근무자의 **배치 이력** (`spec 042` T723 → `spec 049` 타임라인).
 *
 * `GetAssignmentHistory?userSeq` — 🔴 **사업장과 무관하게 그 사람의 배치 전체**다. 옆의 최근 순찰 기록은
 * 선택 사업장 한정이라 캡션으로 구분한다. 반려된 요청은 서버가 주지 않는다(이력 = 승인된 배치).
 *
 * 🔴 **출발지는 응답에 없다** — 근무자의 **소속지**(상세 `siteName`)를 쓴다. 소속지는 바뀌지 않는다는
 * 전제다(사용자 결정 2026-10-26).
 *
 * 🔴 **진행 막대를 두지 않는다**(`spec 049`) — 막대는 비율로 읽힌다. 진행 중이라는 뜻은 채운 점·뱃지·
 * `n일째` 가 이미 말한다.
 *
 * 🔴 **[더보기]는 pageSize 를 키운다** — 진행 중 배치는 1인 1건이라 이력이 짧다. 상태 필터는 뺐다.
 */

const PAGE_STEP = 5

/** 시작일을 1일째로 센다(시안 `7일째`·`46일` 과 같은 셈) */
const dayCount = (from: string, to: Date): number =>
  differenceInCalendarDays(to, parseISO(from)) + 1

/** 오른쪽 일수 문구 — 상태마다 기준이 다르다 */
const durationText = (row: UserAssignmentHistoryRow, today: Date): string | null => {
  if (row.status === ASSIGNMENT_STATUS.SCHEDULED) {
    return `${differenceInCalendarDays(parseISO(row.startDt), today)}일 후 시작`
  }
  if (row.status === ASSIGNMENT_STATUS.ACTIVE) {
    const elapsed = `${dayCount(row.startDt, today)}일째`
    // 종료일이 없거나 지났으면 남은 날을 적지 않는다(복귀 승인 전이라 배치중으로 남는다)
    const remaining = row.endDt ? differenceInCalendarDays(parseISO(row.endDt), today) : -1
    return remaining >= 0 ? `${elapsed} · ${remaining}일 남음` : elapsed
  }
  const end = row.completeDt ?? row.endDt
  return end ? `${dayCount(row.startDt, parseISO(end))}일` : null
}

/**
 * 기간 — 복귀완료면 끝을 **복귀 시각**으로 쓴다(OQ-042-E 해소 `completeDt`, 사용자 결정 2026-10-26).
 * 🔄 `spec 079` D9 — `시작 ~ 종료 · 종료 시각 복귀` 는 날짜가 두 번 나와 `시작 ~ 복귀 일시` 한 번으로(뱃지가 `복귀완료`).
 */
const periodText = (row: UserAssignmentHistoryRow): string =>
  row.status === ASSIGNMENT_STATUS.RETURNED && row.completeDt
    ? `${row.startDt.slice(0, 10)} ~ ${row.completeDt.slice(0, 16).replace('T', ' ')}`
    : formatPeriod(row.startDt, row.endDt)

interface UserAssignmentCardProps {
  userSeq: number
  /** 근무자 소속지 — 출발지로 쓴다. 없으면 `→` 앞을 생략 */
  homeSiteName: string | null
}

const UserAssignmentCard = ({ userSeq, homeSiteName }: UserAssignmentCardProps) => {
  const [pageSize, setPageSize] = useState(PAGE_STEP)
  const history = useUserAssignmentHistory({ userSeq, pageNumber: 1, pageSize })
  const rows = history.data?.items ?? []
  const hasMore = rows.length < (history.data?.totalCount ?? 0)
  const today = new Date()

  return (
    /* 🔄 `spec 084`(목업 `14`): 카드 상자 · 타임라인 점과 세로 선을 없애고 **줄 사이 선** — 한 줄 = 사업장 · 오른쪽 상태 / 아래 기간 · 날수 */
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-panel-title font-semibold text-foreground">배치 이력</h2>
        <span className="text-caption text-muted-foreground">전체 사업장 배치 기록</span>
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
      ) : rows.length === 0 ? (
        /* 한 영역 안의 빈 상태는 글자 한 줄(디자인 규칙) */
        <p className="py-6 text-center text-caption text-muted-foreground">배치 이력이 없습니다</p>
      ) : (
        <>
          <ul className="flex flex-col">
            {rows.map((row) => {
              const duration = durationText(row, today)
              return (
                <li key={row.assignmentSeq} className="flex flex-col gap-0.5 border-b border-border py-3 last:border-0">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {homeSiteName && <span className="text-muted-foreground">{homeSiteName} → </span>}
                      <span className="font-medium text-foreground">{row.siteName}</span>
                    </span>
                    <AssignmentStatusBadge status={row.status} statusName={row.statusName} />
                  </div>
                  <span className="text-caption text-muted-foreground tabular-nums">
                    <span>{periodText(row)}</span>
                    {duration && (
                      <>
                        {' · '}
                        <span>{duration}</span>
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
          {hasMore && (
            <div className="flex justify-center">
              <AppLinkButton
                disabled={history.isFetching}
                onClick={() => setPageSize((size) => Math.min(size + PAGE_STEP, 100))}
              >
                더보기
              </AppLinkButton>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default UserAssignmentCard
