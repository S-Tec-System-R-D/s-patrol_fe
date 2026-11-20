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
  overtimeMin,
  skippedCount,
} from '../lib/activeCourse'
import type { HandOverRow } from '@/features/course-history/types'

import type { DashboardCourse } from '../types'
import CourseStepper from './CourseStepper'

/**
 * 진행 중 회차 카드 — `spec 067`. 누르면 회차 상세로 간다.
 *
 * 🔄 **`spec 084`**: 한 줄에 코스 하나(전체 폭). 머리 한 줄 = 왼쪽 **이름 · 상태(`순찰 중` / `시간초과 +n분`) · `미인증 n`** /
 * 오른쪽 **순찰자 · 시간 막대 · `n/N 지점`**. 시작 시각은 경로 맨 앞 `순찰 시작` 점으로 옮겼다. 시간초과의 빨간 테두리는 없앴다
 * (빨간 상태 글자가 말한다). 아래는 전의 구성 기록이다.
 *
 * 1줄 = **무엇이 · 문제가 있나 · 얼마나**(코스명 · 시간초과/미인증 · `n/N 지점`),
 * 2줄 = **누가 · 언제 · 시간**. 목업의 `4 ~ 5 순찰중` 은 아래 단계 표시와 같은 말이라 뺐다.
 * `spec 073` — `다음: 지점` 문구를 뺐다(칩의 파란 `다음` 과 같은 말 · 분석 문서 §2) · 시간 막대를 길게(짧아 비율이 안 읽혔다).
 * `spec 068` — 서버 이름 그대로: 기준 = `totalMin`. `spec 070` — 순찰자 = 마지막 교대를 받은 사람 · 교대는 일어난 지점 뱃지 위에
 * 적는다. 위치를 모를 때(조회 전 · 실패)만 이름 옆 뱃지로 적는다.
 * 🔴 **`totalMin 0` 은 `기준 없음`** — 막대 · 시간초과를 그리지 않는다(0 분 기준이면 전부 초과로 보인다).
 */

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
  const ratio = Math.min(elapsedRatio(course, elapsedMin), 1)
  const userName = currentUserName(course, handOvers)
  const handOverOrders = handOvers.flatMap((row) => (row.lastOrderNo === null ? [] : [row.lastOrderNo]))

  return (
    <Link
      to={paths.service.patrolZoneDetail(course.historySeq)}
      className="flex flex-col rounded-[10px] border border-border px-[18px] pt-3.5 pb-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h3 className="text-[14px] font-semibold text-foreground">{course.courseName}</h3>
        {over > 0 ? (
          <AppBadge variant="danger" icon={false} className="gap-1">
            <ClockAlertIcon size={13} strokeWidth={2.2} aria-hidden />
            시간초과 +{over}분
          </AppBadge>
        ) : (
          /* 문제없이 도는 회차 — 파란 고리. 순찰 중인 동안 계속 돈다(`course-spin-anim`). 멈춘 회차(교대 요청 중)는 적지 않는다 */
          !course.pausedYn && (
            <AppBadge variant="point" className="course-spin-anim">
              순찰 중
            </AppBadge>
          )
        )}
        {skipped > 0 && <AppBadge variant="neutral">미인증 {skipped}</AppBadge>}

        <div className="ml-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 text-caption text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{userName ?? '-'}</span>
            {course.handoverCount > 0 && handOverOrders.length === 0 && (
              <AppBadge variant="plain" className={cn(cardBadge, 'gap-1')}>
                <RepeatIcon size={11} strokeWidth={2} />
                교대
              </AppBadge>
            )}
          </span>
          {hasStandard(course) ? (
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-1 w-20 overflow-hidden rounded-full bg-muted sm:w-28">
                <span
                  className={cn('block h-full rounded-full', over > 0 ? 'bg-danger' : 'bg-point')}
                  style={{ width: `${ratio * 100}%` }}
                />
              </span>
              <span className={cn('tabular-nums', over > 0 && 'font-medium text-danger')}>
                {elapsedMin}분 / {course.totalMin}분
              </span>
            </span>
          ) : (
            <span className="tabular-nums">{elapsedMin}분 · 기준 없음</span>
          )}
          <span className="tabular-nums">
            <span className="font-semibold text-foreground">{checkedCount(course.points)}</span>/
            {course.points.length} 지점
          </span>
        </div>
      </div>

      <CourseStepper
        points={course.points}
        startDt={course.startDt}
        handOverOrders={handOverOrders}
        paused={course.pausedYn}
      />
    </Link>
  )
}

export default ActiveCourseCard
