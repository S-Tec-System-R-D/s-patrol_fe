import { FootprintsIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'

import { sortActiveCourses } from '../lib/activeCourse'
import type { ActiveCourse } from '../types'
import ActiveCourseCard from './ActiveCourseCard'

/**
 * 진행 중인 순찰 — `spec 067`. `screens.md` §1-2A(진행 중인 순찰 현황)를 이 섹션이 흡수했다.
 *
 * 🔴 **조회 중 · 실패를 "진행 중 없음" 으로 보여주지 않는다** — 셋이 섞이면 순찰이 멈춘 것처럼
 * 읽힌다(027 T324 에서 겪은 퇴행). 지금은 고정 데이터라 `?preview=` 로만 본다.
 */

export type ActiveCourseState = 'ready' | 'loading' | 'error'

interface ActiveCourseSectionProps {
  courses: ActiveCourse[]
  state: ActiveCourseState
  onRetry: () => void
}

const ActiveCourseSection = ({ courses, state, onRetry }: ActiveCourseSectionProps) => (
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
        {sortActiveCourses(courses).map((course) => (
          <ActiveCourseCard key={course.historySeq} course={course} />
        ))}
      </div>
    )}
  </section>
)

export default ActiveCourseSection
