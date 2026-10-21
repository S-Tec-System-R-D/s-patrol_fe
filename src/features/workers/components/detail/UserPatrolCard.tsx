import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ActivityIcon, ChevronRightIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import { usePointHistoryList } from '@/features/course-history/hooks/usePointHistoryList'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import { paths } from '@/router/paths'

/**
 * 근무자의 **최근 순찰 기록** (`spec 038` 후속, 사용자 요청 2026-10-21).
 *
 * 🔴 **새 API 가 아니다** — 지점 순찰이력(037)이 쓰는 `GetPointHistory` 에 **`userSeq`** 를 걸었다
 * (실측 2026-10-21: 그 사람 행만, 최신순). 배치 이력·출퇴근 기록은 API 가 없어 이 카드가 근무자
 * 상세의 유일한 "이력" 이다.
 *
 * 🔴 **선택한 사업장의 기록**이다(`siteSeq` 필수) — 배치 온 사람이면 **이 사업장에서 한 순찰**만
 * 보인다. 소속지 기록까지 합치려면 사업장을 바꿔 봐야 한다(서버가 사업장 단위로만 준다).
 *
 * 🔴 **최근 N건만 보인다** — 상세는 요약이 목적이다. 전부는 "전체 기록" 으로 순찰이력 목록에 보낸다.
 * ⚠️ 그 목록은 순찰자를 **이름 부분 검색**으로만 거른다(037 — 목록에 `userSeq` 필터 UI 가 없다).
 * 동명이인이 있으면 함께 나온다.
 */

/** 보여줄 최근 기록 수 */
const PREVIEW_COUNT = 8

/** `'2026-09-18T15:49:24'` → `'2026-09-18 15:49'` — 여러 날에 걸친 목록이라 날짜를 자르지 않는다 */
const formatCheckDt = (value: string): string => value.replace('T', ' ').slice(0, 16)

interface UserPatrolCardProps {
  userSeq: number
  userName: string
  siteSeq: number | null
}

const UserPatrolCard = ({ userSeq, userName, siteSeq }: UserPatrolCardProps) => {
  const params = useMemo(
    () =>
      siteSeq === null ? null : { siteSeq, userSeq, pageNumber: 1, pageSize: PREVIEW_COUNT },
    [siteSeq, userSeq]
  )
  const history = usePointHistoryList(params)
  const rows = history.data?.items ?? []

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-panel-title font-bold text-foreground">최근 순찰 기록</h3>
          {/* 🔴 전체 건수를 적는다 — "8건" 만 보이면 8건이 전부인지 잘린 것인지 알 수 없다 */}
          {history.data && history.data.totalCount > 0 && (
            <p className="text-caption text-muted-foreground">
              이 사업장 인증 {history.data.totalCount}건 중 최근 {rows.length}건
            </p>
          )}
        </div>
        <Link
          to={`${paths.service.patrolPoints}?user=${encodeURIComponent(userName)}`}
          className="shrink-0 text-caption text-muted-foreground hover:text-foreground"
        >
          전체 기록
        </Link>
      </div>

      {history.isPending ? (
        <div className="h-[160px] animate-pulse rounded-sm bg-muted" />
      ) : history.isError ? (
        /* 🔴 조회 실패를 "기록 없음" 으로 보여주지 않는다 — 이 카드만 실패할 수 있다(037 승계) */
        <div>
          <AppEmpty
            icon={TriangleAlertIcon}
            title="순찰 기록을 불러오지 못했습니다"
            description={history.error?.message}
          />
          <div className="flex justify-center">
            <AppButton variant="sub" onClick={() => void history.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : rows.length === 0 ? (
        /* 🔴 "순찰하지 않았다" 로 단정하지 않는다 — 이 사업장의 **인증 기록**이 없을 뿐이다 */
        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
          <ActivityIcon size={20} strokeWidth={1.5} className="text-muted-foreground/50" />
          <p className="text-body font-medium text-foreground">순찰 기록이 없습니다</p>
          <p className="text-caption text-muted-foreground">
            이 사업장에서 지점을 인증하면 여기에 기록됩니다.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {rows.map((row) => {
            const result = pointCheckBadge(row.status, row.checkDt, row.hasMemo)
            const overtime = overtimeBadge(row.overTimeYn)
            return (
              <li key={row.detailSeq} className="border-b border-border/50 last:border-0">
                <Link
                  to={paths.service.patrolPointDetail(row.detailSeq)}
                  className="flex items-center gap-3 px-1 py-2.5 text-body hover:bg-muted/50"
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCheckDt(row.checkDt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{row.pointName}</span>
                    <span className="ml-2 text-muted-foreground">{row.courseName}</span>
                  </span>
                  {/* 결과·시간초과는 독립 축이라 2개 병기(036 결정) */}
                  <span className="flex shrink-0 items-center gap-1">
                    <AppBadge variant={result.variant}>{result.label}</AppBadge>
                    {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
                  </span>
                  <ChevronRightIcon size={14} className="shrink-0 text-muted-foreground/60" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default UserPatrolCard
