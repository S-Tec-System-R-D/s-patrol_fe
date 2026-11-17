import { format, isToday, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { COURSE_HISTORY_STATUS, type CourseHistoryRow } from '@/features/course-history/types'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import type { AreaState } from '../types'
import AreaFallback from './AreaFallback'

/**
 * 최근 기록 — `spec 073` T1218. `최근 미완료 · 시간초과`(067) 와 `최근 종료된 순찰`(069) 을 **한 패널**에 둔다.
 * 진행 중(카드 여러 장)과 구분되게 흰 패널 하나 · 두 목록이다(분석 문서 §3).
 *
 * 🔴 **탭 + 숫자 뱃지, `2xl` 부터 두 목록을 나란히** — xl 에서는 이 패널이 화면 절반 열이라 나란히 두면 좁다.
 * 숫자 뱃지가 없으면 숨은 쪽을 놓친다(분석 §4).
 * 🔴 **미완료 · 시간초과는 회차 1건 = 1행 · 회차 상태만**(`spec 079` D13) — 놓친 지점 이름 · `미인증 n` 은 적지 않는다
 *    (회차를 열면 보인다). 행마다 인증 내역을 부르던 호출도 없어졌다.
 * 🔴 **종료된 순찰은 예외만 뱃지**(분석 §1-3) — 모든 행이 초록 `완료` 면 아무것도 말하지 않는다. 대신 미니 막대 + 인증 수.
 * 🔴 **처리할 목록이 아니라 최근 기록이다**(067 결정 유지) — 확인하면 사라지는 기능은 없다(DB 컬럼 없음).
 */

type Tab = 'issue' | 'finished'

const TAB_LABEL: Record<Tab, string> = { issue: '미완료 · 시간초과', finished: '종료된 순찰' }

const parse = (value: string | null): Date | null => {
  if (value === null) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

/** 순찰자 없는 이력이 실존한다 — 빈 칸이면 데이터 누락처럼 보인다(`ZoneHistoryCard` 와 같은 문구) */
const runnerLabel = (userList: CourseHistoryRow['userList']): string => {
  if (userList.length === 0) return '순찰자 미지정'
  const [first, ...rest] = userList
  return rest.length === 0 ? first.userName : `${first.userName} 외 ${rest.length}명`
}

/** 끝난 시각 — 어제 끝난 회차는 `어제` 를 아래에 적는다(최근 미완료는 어제~오늘) */
const EndTime = ({ endDt }: { endDt: string | null }) => {
  const parsed = parse(endDt)
  return (
    <span className="flex w-10 shrink-0 flex-col text-caption text-muted-foreground tabular-nums">
      {parsed ? format(parsed, 'HH:mm') : '-'}
      {parsed && !isToday(parsed) && <span className="text-label">어제</span>}
    </span>
  )
}

const IssueRow = ({ row }: { row: CourseHistoryRow }) => {
  /* 🔄 D13 — 회차 상태만 적는다(서버 `미완료` = 도중 종료). 지점 결과는 회차를 열어야 보인다 */
  const result = row.status === COURSE_HISTORY_STATUS.INCOMPLETE ? courseResultBadge(row.status) : null
  const overtime = overtimeBadge(row.overtimeYn)

  return (
    <li className="border-b border-border last:border-0">
      <Link
        to={paths.service.patrolZoneDetail(row.historySeq)}
        className="flex items-center gap-3 rounded-sm px-1 py-2.5 text-body hover:bg-muted/40"
      >
        <EndTime endDt={row.endDt} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate">
            <span className="font-semibold text-foreground">{row.courseName}</span>
            <span className="text-muted-foreground"> · {runnerLabel(row.userList)}</span>
          </span>
          <span className="text-caption text-muted-foreground tabular-nums">
            소요 {formatElapsed(row.actualElapsedTime)}
          </span>
        </span>
        <span className="flex shrink-0 gap-1">
          {result && (
            <AppBadge variant={result.variant} className={cardBadge}>
              {result.label}
            </AppBadge>
          )}
          {overtime && (
            <AppBadge variant={overtime.variant} className={cardBadge}>
              {overtime.label}
            </AppBadge>
          )}
        </span>
      </Link>
    </li>
  )
}

const FinishedRow = ({ row }: { row: CourseHistoryRow }) => {
  const ratio = row.pointCount > 0 ? Math.min(row.checkedCount / row.pointCount, 1) : 0
  const overtime = overtimeBadge(row.overtimeYn)

  return (
    <li className="border-b border-border last:border-0">
      <Link
        to={paths.service.patrolZoneDetail(row.historySeq)}
        className="flex items-center gap-3 rounded-sm px-1 py-2.5 text-body hover:bg-muted/40"
      >
        <EndTime endDt={row.endDt} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-semibold text-foreground">{row.courseName}</span>
          <span className="truncate text-caption text-muted-foreground tabular-nums">
            {runnerLabel(row.userList)} · {formatElapsed(row.actualElapsedTime)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {overtime && (
            <AppBadge variant={overtime.variant} className={cardBadge}>
              {overtime.label}
            </AppBadge>
          )}
          <span aria-hidden className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:block">
            {/* 인증 비율 막대는 메인 포인트색 하나(2026-11-16 사용자 결정 — 색 수를 줄인다) */}
            <span className="block h-full rounded-full bg-point" style={{ width: `${ratio * 100}%` }} />
          </span>
          <span className="w-9 text-right text-caption text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{row.checkedCount}</span>/{row.pointCount}
          </span>
        </span>
      </Link>
    </li>
  )
}

const ListBody = ({
  tab,
  rows,
  state,
  onRetry,
}: {
  tab: Tab
  rows: CourseHistoryRow[]
  state: AreaState
  onRetry: () => void
}) =>
  state !== 'ready' ? (
    <AreaFallback state={state} label="최근 기록" onRetry={onRetry} />
  ) : rows.length === 0 ? (
    <p className="py-6 text-center text-caption text-muted-foreground">
      {tab === 'issue' ? '어제와 오늘 미완료 · 시간초과 순찰이 없습니다' : '오늘 종료된 순찰이 없습니다'}
    </p>
  ) : (
    <ul className="flex flex-col" aria-label={TAB_LABEL[tab]}>
      {rows.map((row) =>
        tab === 'issue' ? (
          <IssueRow key={row.historySeq} row={row} />
        ) : (
          <FinishedRow key={row.historySeq} row={row} />
        )
      )}
    </ul>
  )

const CountBadge = ({ count, alert = false }: { count: number; alert?: boolean }) => (
  <span
    className={cn(
      'rounded-sm px-1.5 py-0.5 text-label font-semibold tabular-nums',
      alert && count > 0 ? 'bg-danger-bg text-danger-foreground' : 'bg-muted text-muted-foreground'
    )}
  >
    {count}
  </span>
)

const AllLink = () => (
  <Link
    to={paths.service.patrolZones}
    className="ml-auto flex shrink-0 items-center text-caption text-muted-foreground hover:text-foreground"
  >
    전체 보기
    <ChevronRightIcon size={14} />
  </Link>
)

interface RecentRecordPanelProps {
  issues: CourseHistoryRow[]
  finished: CourseHistoryRow[]
  state: AreaState
  onRetry: () => void
}

const RecentRecordPanel = ({ issues, finished, state, onRetry }: RecentRecordPanelProps) => {
  const [tab, setTab] = useState<Tab>('issue')
  const lists: { key: Tab; rows: CourseHistoryRow[] }[] = [
    { key: 'issue', rows: issues },
    { key: 'finished', rows: finished },
  ]

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-panel-title font-bold text-foreground">최근 기록</h2>
      <div className="rounded-lg border border-border bg-card">
        {/* 탭 — `2xl` 미만 */}
        <div className="flex items-center gap-1 border-b border-border px-4 2xl:hidden" role="tablist">
          {lists.map(({ key, rows }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-2 py-2.5 text-body font-semibold text-muted-foreground transition-colors hover:text-foreground',
                tab === key && 'border-point font-bold text-foreground'
              )}
            >
              {TAB_LABEL[key]}
              {state === 'ready' && <CountBadge count={rows.length} alert={key === 'issue'} />}
            </button>
          ))}
          <AllLink />
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 2xl:divide-x 2xl:divide-border">
          {lists.map(({ key, rows }) => (
            <div key={key} className={cn('flex-col gap-1 p-4 2xl:flex', tab === key ? 'flex' : 'hidden')}>
              {/* 목록 머리 — `2xl` 에서만(그 아래는 탭이 대신한다) */}
              <div className="hidden items-center gap-2 pb-1 2xl:flex">
                <h3 className="text-body font-semibold text-foreground">{TAB_LABEL[key]}</h3>
                {state === 'ready' && <CountBadge count={rows.length} alert={key === 'issue'} />}
                <AllLink />
              </div>
              <ListBody tab={key} rows={rows} state={state} onRetry={onRetry} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentRecordPanel
