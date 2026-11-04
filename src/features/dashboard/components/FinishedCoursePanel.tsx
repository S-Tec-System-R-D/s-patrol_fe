import { format, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon, MessageSquareTextIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import type { CourseHistoryRow } from '@/features/course-history/types'
import { paths } from '@/router/paths'

import type { AreaState } from '../types'
import AreaFallback from './AreaFallback'

/**
 * 최근 종료된 순찰 — `spec 069`(사용자 요청 2026-11-04). 진행 중 카드는 끝나면 바로 사라져서, 여러 순찰이
 * 동시에 돌면 무엇이 끝났는지 알 수 없었다. 오늘 끝난 회차가 여기 남는다.
 *
 * 🔴 **인증 수에 색을 입히지 않는다** — 건너뛰고 끝내면 `완료` 인데 `2/5` 다(실측). 결과는 뱃지가 말한다.
 * 🔴 좁은 폭(`md` 미만)은 순찰자 · 인증 수 · 소요를 숨긴다 — 시각 · 코스 · 뱃지만으로 읽힌다.
 */

const formatTime = (value: string | null): string => {
  if (value === null) return '-'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'HH:mm') : value
}

/** 순찰자 없는 이력이 실존한다 — 빈 칸이면 데이터 누락처럼 보인다(`ZoneHistoryCard` 와 같은 문구) */
const runnerLabel = (userList: CourseHistoryRow['userList']): string => {
  if (userList.length === 0) return '순찰자 미지정'
  const [first, ...rest] = userList
  return rest.length === 0 ? first.userName : `${first.userName} 외 ${rest.length}명`
}

interface FinishedCoursePanelProps {
  rows: CourseHistoryRow[]
  state: AreaState
  onRetry: () => void
}

const FinishedCoursePanel = ({ rows, state, onRetry }: FinishedCoursePanelProps) => (
  <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
    <div className="flex items-center gap-2">
      <h2 className="text-panel-title font-bold text-foreground">최근 종료된 순찰</h2>
      <Link
        to={paths.service.patrolZones}
        className="ml-auto flex shrink-0 items-center text-caption text-muted-foreground hover:text-foreground"
      >
        전체 보기
        <ChevronRightIcon size={14} />
      </Link>
    </div>

    {state !== 'ready' ? (
      <AreaFallback state={state} label="최근 종료된 순찰" onRetry={onRetry} />
    ) : rows.length === 0 ? (
      <p className="py-6 text-center text-caption text-muted-foreground">오늘 종료된 순찰이 없습니다</p>
    ) : (
      <ul className="flex flex-col">
        {rows.map((row) => {
          const result = courseResultBadge(row.status)
          const overtime = overtimeBadge(row.overtimeYn)
          return (
            <li key={row.historySeq} className="border-b border-border last:border-0">
              <Link
                to={paths.service.patrolZoneDetail(row.historySeq)}
                className="flex items-center gap-3 rounded-sm px-1 py-2.5 text-body hover:bg-muted/40"
              >
                <span className="w-10 shrink-0 text-caption text-muted-foreground tabular-nums">
                  {formatTime(row.endDt)}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{row.courseName}</span>
                <span className="hidden w-24 shrink-0 truncate text-caption text-muted-foreground md:block">
                  {runnerLabel(row.userList)}
                </span>
                <span className="hidden w-16 shrink-0 text-caption text-muted-foreground tabular-nums md:block">
                  {row.checkedCount}/{row.pointCount} 인증
                </span>
                <span className="hidden w-20 shrink-0 text-caption text-muted-foreground tabular-nums md:block">
                  {formatElapsed(row.actualElapsedTime)}
                </span>
                {/* 폭 고정 — 뱃지가 1개 · 2개로 갈려도 앞의 열이 행마다 밀리지 않는다(`RecentIssuePanel` 과 같다) */}
                <span className="flex w-24 shrink-0 gap-1">
                  <AppBadge variant={result.variant} className={cardBadge}>
                    {result.label}
                  </AppBadge>
                  {overtime && (
                    <AppBadge variant={overtime.variant} className={cardBadge}>
                      {overtime.label}
                    </AppBadge>
                  )}
                </span>
                <span className="w-4 shrink-0 text-muted-foreground">
                  {row.hasMemo && <MessageSquareTextIcon size={14} aria-label="메모 있음" />}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    )}
  </section>
)

export default FinishedCoursePanel
