import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ActivityIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  MessageSquareIcon,
  MinusIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import { usePointHistoryList } from '@/features/course-history/hooks/usePointHistoryList'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import { POINT_HISTORY_STATUS, type PointHistoryRow } from '@/features/course-history/types'
import { paths } from '@/router/paths'

/**
 * 근무자의 **최근 순찰 기록** (`spec 038` 후속, 사용자 요청 2026-10-21 → `spec 049` 날짜 묶음).
 *
 * 🔴 **새 API 가 아니다** — 지점 순찰이력(037)이 쓰는 `GetPointHistory` 에 **`userSeq`** 를 걸었다
 * (실측 2026-10-21: 그 사람 행만, 최신순).
 *
 * 🔴 **선택한 사업장의 기록**이다(`siteSeq` 필수) — 배치 온 사람이면 **이 사업장에서 한 순찰**만
 * 보인다. 소속지 기록까지 합치려면 사업장을 바꿔 봐야 한다(서버가 사업장 단위로만 준다).
 *
 * 🔴 **최근 N건만 보인다** — 상세는 요약이 목적이다. 전부는 "전체 기록" 으로 순찰이력 목록에 보낸다.
 * ⚠️ 그 목록은 순찰자를 **이름 부분 검색**으로만 거른다(037 — 목록에 `userSeq` 필터 UI 가 없다).
 * 동명이인이 있으면 함께 나온다.
 *
 * 🔴 **결과는 왼쪽 ✓/✕ 가, 오른쪽은 예외만** 말한다(`spec 049`, 사용자 결정 2026-10-26) — 오른쪽에
 * `이상없음` 까지 두면 가장 흔한 행이 ✓ 와 같은 말을 두 번 한다. 5종 문구는 아이콘의 접근 이름으로 남긴다.
 */

/** 보여줄 최근 기록 수 */
const PREVIEW_COUNT = 8

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/**
 * `'2026-10-26'` → `'10월 26일 (월)'`.
 * 🔴 머리에 건수를 적지 않는다 — 최근 8건에서 잘려 마지막 날짜가 실제보다 적게 보인다(`spec 049`)
 */
const formatDay = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number)
  return `${m}월 ${d}일 (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`
}

/** 서버 순서(최신순)를 지키며 날짜별로 묶는다 */
const groupByDay = (rows: PointHistoryRow[]) => {
  const groups: { day: string; rows: PointHistoryRow[] }[] = []
  for (const row of rows) {
    const day = row.checkDt.slice(0, 10)
    const last = groups[groups.length - 1]
    if (last?.day === day) last.rows.push(row)
    else groups.push({ day, rows: [row] })
  }
  return groups
}

/** 왼쪽 결과 아이콘 — 인증을 했나(✓) 못 했나(✕). 이 응답에 오지 않는 상태는 중립 표시 */
const ResultIcon = ({ row }: { row: PointHistoryRow }) => {
  const { label } = pointCheckBadge(row.status, row.checkDt, row.hasMemo)
  const [Icon, tone] =
    row.status === POINT_HISTORY_STATUS.COMPLETED
      ? [CheckIcon, 'bg-success-bg text-success-foreground']
      : row.status === POINT_HISTORY_STATUS.INCOMPLETE
        ? [XIcon, 'bg-danger-bg text-danger-foreground']
        : [MinusIcon, 'bg-muted text-muted-foreground']
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`flex size-5 shrink-0 items-center justify-center rounded-full ${tone}`}
    >
      <Icon size={12} strokeWidth={2.5} aria-hidden />
    </span>
  )
}

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
  const today = format(new Date(), 'yyyy-MM-dd')

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
        <div className="flex flex-col gap-3">
          {groupByDay(rows).map((group) => (
            <div key={group.day} className="flex flex-col">
              <h4 className="flex items-center gap-1.5 px-1 pb-1 text-meta font-semibold text-muted-foreground">
                {formatDay(group.day)}
                {group.day === today && <span className="text-point-foreground">오늘</span>}
              </h4>
              <ul className="flex flex-col">
                {group.rows.map((row) => {
                  const overtime = overtimeBadge(row.overTimeYn)
                  return (
                    <li key={row.detailSeq}>
                      <Link
                        to={paths.service.patrolPointDetail(row.detailSeq)}
                        className="flex items-center gap-3 rounded-sm px-1 py-2 text-body hover:bg-muted/50"
                      >
                        <ResultIcon row={row} />
                        <span className="shrink-0 text-panel-title font-bold tabular-nums text-foreground">
                          {row.checkDt.slice(11, 16)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium text-foreground">{row.pointName}</span>
                          <span className="ml-2 text-caption text-muted-foreground">{row.courseName}</span>
                        </span>
                        {/* 🔴 예외만 — 시간초과·메모는 결과와 독립 축이다(036 결정). 정상 행은 비운다 */}
                        <span className="flex shrink-0 items-center gap-3 text-meta">
                          {overtime && (
                            <span className="flex items-center gap-1 text-warning-foreground">
                              <ClockIcon size={12} aria-hidden />
                              {overtime.label}
                            </span>
                          )}
                          {row.hasMemo && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MessageSquareIcon size={12} aria-hidden />
                              메모
                            </span>
                          )}
                          {/* 미완료 행은 인증 방식이 '' 다(실측) — 빈 칸을 그리지 않는다 */}
                          {row.authMethodName && (
                            <span className="text-muted-foreground">{row.authMethodName}</span>
                          )}
                        </span>
                        <ChevronRightIcon size={14} className="shrink-0 text-muted-foreground/60" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default UserPatrolCard
