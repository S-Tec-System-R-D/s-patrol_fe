import { format, isValid, parseISO } from 'date-fns'
import { ClockAlertIcon, RepeatIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import {
  checkedCount,
  currentUserName,
  elapsedRatio,
  hasStandard,
  nextPoint,
  overtimeMin,
  skippedCount,
} from '../lib/activeCourse'
import type { HandOverRow } from '@/features/course-history/types'

import type { DashboardCourse } from '../types'
import CourseStepper from './CourseStepper'

/**
 * 진행 중 회차 카드 — `spec 067`. 누르면 회차 상세로 간다.
 *
 * 1줄 = **무엇이 · 문제가 있나 · 얼마나**(코스명 · 시간초과/건너뜀 · `n/N 지점`),
 * 2줄 = **누가 · 언제 · 시간 · 다음**. 목업의 `4 ~ 5 순찰중` 은 아래 단계 표시와 같은 말이라 뺐다.
 * `spec 068` — 서버 이름 그대로: 기준 = `totalMin`. `spec 070` — 순찰자 = 마지막 교대를 받은 사람 · 교대는 일어난 지점 뱃지 위에
 * 적는다. 위치를 모를 때(조회 전 · 실패)만 이름 옆 뱃지로 적는다.
 * 🔴 **`totalMin 0` 은 `기준 없음`** — 막대 · 시간초과를 그리지 않는다(0 분 기준이면 전부 초과로 보인다).
 */

const formatTime = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'HH:mm') : value
}

interface ActiveCourseCardProps {
  course: DashboardCourse
  /** 지금의 경과 분 — 섹션이 1분마다 다시 센다(`elapsedMinAt`) */
  elapsedMin: number
  /** 교대 기록 — 조회 전이면 없다 */
  handOvers?: HandOverRow[]
}

const ActiveCourseCard = ({ course, elapsedMin, handOvers = [] }: ActiveCourseCardProps) => {
  const over = overtimeMin(course, elapsedMin)
  const skipped = skippedCount(course.points)
  const next = nextPoint(course.points)
  const ratio = Math.min(elapsedRatio(course, elapsedMin), 1)
  const userName = currentUserName(course, handOvers)
  const handOverOrders = handOvers.flatMap((row) => (row.lastOrderNo === null ? [] : [row.lastOrderNo]))

  return (
    <Link
      to={paths.service.patrolZoneDetail(course.historySeq)}
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40',
        over > 0 ? 'border-danger' : 'border-border'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-panel-title font-bold text-foreground">{course.courseName}</h3>
        {over > 0 && (
          <AppBadge variant="danger" className={cn(cardBadge, 'gap-1')}>
            <ClockAlertIcon size={12} strokeWidth={2} />
            시간초과 +{over}분
          </AppBadge>
        )}
        {skipped > 0 && (
          <AppBadge variant="warning" className={cardBadge}>
            건너뜀 {skipped}
          </AppBadge>
        )}
        <span className="ml-auto text-caption text-muted-foreground tabular-nums">
          <span className="font-bold text-foreground">{checkedCount(course.points)}</span>/
          {course.points.length} 지점
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{userName ?? '-'}</span>
          {course.handoverCount > 0 && handOverOrders.length === 0 && (
            <AppBadge variant="muted" className={cn(cardBadge, 'gap-1')}>
              <RepeatIcon size={11} strokeWidth={2} />
              교대
            </AppBadge>
          )}
        </span>
        <span className="tabular-nums">{formatTime(course.startDt)} 시작</span>
        {hasStandard(course) ? (
          <span className="flex items-center gap-2">
            <span className={cn('tabular-nums', over > 0 && 'font-semibold text-danger-foreground')}>
              {elapsedMin}분 / {course.totalMin}분
            </span>
            <span aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-muted">
              <span
                className={cn('block h-full rounded-full', over > 0 ? 'bg-danger' : 'bg-point')}
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
          </span>
        ) : (
          <span className="tabular-nums">{elapsedMin}분 · 기준 없음</span>
        )}
        {next && (
          <span>
            다음: <span className="font-medium text-foreground">{next.pointName}</span>
          </span>
        )}
      </div>

      <CourseStepper points={course.points} handOverOrders={handOverOrders} paused={course.pausedYn} />
    </Link>
  )
}

export default ActiveCourseCard
