import { format, isValid, parseISO } from 'date-fns'
import { ClockAlertIcon, RepeatIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import { checkedCount, elapsedRatio, nextPoint, overtimeMin, skippedCount } from '../lib/activeCourse'
import type { ActiveCourse } from '../types'
import CourseStepper from './CourseStepper'

/**
 * 진행 중 회차 카드 — `spec 067`. 누르면 회차 상세로 간다.
 *
 * 1줄 = **무엇이 · 문제가 있나 · 얼마나**(코스명 · 시간초과/건너뜀 · `n/N 지점`),
 * 2줄 = **누가 · 언제 · 시간 · 다음**. 목업의 `4 ~ 5 순찰중` 은 아래 단계 표시와 같은 말이라 뺐다.
 */

const formatTime = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'HH:mm') : value
}

interface ActiveCourseCardProps {
  course: ActiveCourse
}

const ActiveCourseCard = ({ course }: ActiveCourseCardProps) => {
  const over = overtimeMin(course)
  const skipped = skippedCount(course.points)
  const next = nextPoint(course.points)
  const ratio = Math.min(elapsedRatio(course), 1)

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
          <span className="font-medium text-foreground">{course.userName}</span>
          {course.swapped && (
            <AppBadge variant="muted" className={cn(cardBadge, 'gap-1')}>
              <RepeatIcon size={11} strokeWidth={2} />
              교대
            </AppBadge>
          )}
        </span>
        <span className="tabular-nums">{formatTime(course.startDt)} 시작</span>
        <span className="flex items-center gap-2">
          <span className={cn('tabular-nums', over > 0 && 'font-semibold text-danger-foreground')}>
            {course.elapsedMin}분 / {course.standardMin}분
          </span>
          <span aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-muted">
            <span
              className={cn('block h-full rounded-full', over > 0 ? 'bg-danger' : 'bg-point')}
              style={{ width: `${ratio * 100}%` }}
            />
          </span>
        </span>
        {next && (
          <span>
            다음: <span className="font-medium text-foreground">{next.pointName}</span>
          </span>
        )}
      </div>

      <CourseStepper points={course.points} />
    </Link>
  )
}

export default ActiveCourseCard
