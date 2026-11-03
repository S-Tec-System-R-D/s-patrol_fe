import { FootprintsIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'

import { elapsedMinAt, sortActiveCourses } from '../lib/activeCourse'
import type { AreaState, DashboardCourse } from '../types'
import ActiveCourseCard from './ActiveCourseCard'

/**
 * 진행 중인 순찰 — `spec 067`. `screens.md` §1-2A(진행 중인 순찰 현황)를 이 섹션이 흡수했다.
 *
 * 🔴 **조회 중 · 실패를 "진행 중 없음" 으로 보여주지 않는다** — 셋이 섞이면 순찰이 멈춘 것처럼
 * 읽힌다(027 T324 에서 겪은 퇴행).
 * 🔴 **경과는 1분마다 다시 센다**(`spec 068`) — 서버를 다시 부르지 않고, 받은 시각(`receivedAt`)부터 흐른
 * 시간을 더한다. 정렬도 그 값으로 다시 한다(시간초과가 되면 위로 올라간다).
 */

const TICK_MS = 60_000

/** 1분마다 바뀌는 지금 시각 */
const useMinuteNow = (): number => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [])
  return now
}

interface ActiveCourseSectionProps {
  courses: DashboardCourse[]
  state: AreaState
  /** 응답을 받은 시각(ms) — react-query `dataUpdatedAt` */
  receivedAt: number
  onRetry: () => void
}

const ActiveCourseSection = ({ courses, state, receivedAt, onRetry }: ActiveCourseSectionProps) => {
  // 새로 받은 직후에는 tick 이 받은 시각보다 앞일 수 있다 — 응답 값 그대로 보이게 받은 시각에 맞춘다
  const now = Math.max(useMinuteNow(), receivedAt)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-panel-title font-bold text-foreground">진행 중인 순찰</h2>
        {state === 'ready' && (
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-label font-semibold text-muted-foreground tabular-nums">
            {courses.length}
          </span>
        )}
      </div>

      {state === 'loading' ? (
        <div className="flex flex-col gap-3" aria-label="불러오는 중">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-[118px] animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : state === 'error' ? (
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="진행 중인 순찰을 불러오지 못했습니다"
            action={
              <AppButton variant="sub" onClick={onRetry}>
                다시 시도
              </AppButton>
            }
          />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty icon={FootprintsIcon} title="지금 진행 중인 순찰이 없습니다" />
        </div>
      ) : (
        /* 🔴 넓은 폭은 **2열**(사용자 결정 2026-10-30) — 1열이면 단계가 왼쪽 절반에서 끝나 오른쪽이 비었다.
           정렬 순서는 왼쪽 → 오른쪽, 위 → 아래로 읽힌다(시간초과가 맨 왼쪽 위) */
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {sortActiveCourses(courses, receivedAt, now).map((course) => (
            <ActiveCourseCard
              key={course.historySeq}
              course={course}
              elapsedMin={elapsedMinAt(course, receivedAt, now)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ActiveCourseSection
