import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import type { CourseHistoryRow } from '@/features/course-history/types'
import { countByCourse, countByHour, isCapped, RECENT_COURSE_CAP } from '../lib/todayStats'
import type { AreaState } from '../types'
import AreaFallback from './AreaFallback'

/**
 * 오늘 요약 — 대시보드 세 칸의 가운데(`spec 084`). `오늘 시간대별 순찰`(세로 막대)과 `오늘 코스별 순찰`(가로 막대).
 *
 * 🔴 **새로 받지 않는다** — `최근 기록` 과 같은 어제~오늘 회차(최대 100건)에서 센다(`todayStats`). 그래서 조회 중 · 실패도
 *    그 영역과 같이 움직인다.
 * 🔴 **받은 것이 100건이면 `최근 100건 기준` 이라고 적는다** — 하루 순찰이 그보다 많으면 숫자가 실제보다 적다(사용자 결정 2026-11-20).
 * 🔴 **코스별은 코스 목록을 받았으면 0회 코스도 줄을 그린다** — "오늘 안 돌았다"가 정보다. 목록을 못 받았으면 돈 코스만.
 * 차트는 shadcn 모양(가로 격자만 · 축 선 없음 · 둥근 막대 · 카드 툴팁) — 지금 시간대만 진한 파랑.
 * 이름이 붙는 가로 막대는 직접 그린다(이름 왼쪽 · 값 오른쪽 끝 정렬이 차트보다 깔끔하다).
 */

const HOUR_TICKS = [0, 6, 12, 18, 23]

const HourTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { hour: number; count: number } }[] }) => {
  const item = active ? payload?.[0]?.payload : undefined
  if (!item) return null
  return (
    <div className="min-w-[110px] rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-caption shadow-lg">
      <p className="font-medium text-foreground tabular-nums">{item.hour}시</p>
      <p className="flex items-center gap-2 text-muted-foreground">
        순찰
        <span className="ml-auto font-medium text-foreground tabular-nums">{item.count}회</span>
      </p>
    </div>
  )
}

interface TodaySummaryPanelProps {
  /** 어제~오늘 회차(`useRecentCourses`) */
  rows: CourseHistoryRow[]
  /** 사용 중인 코스 목록 — 0회 줄을 그리려고 받는다. 못 받았으면 `undefined` */
  courses: { courseSeq: number; courseName: string }[] | undefined
  /** `yyyy-MM-dd` */
  today: string
  /** 지금 시(0~23) — 그 시간대 막대만 진하게 */
  currentHour: number
  state: AreaState
  onRetry: () => void
}

const TodaySummaryPanel = ({ rows, courses, today, currentHour, state, onRetry }: TodaySummaryPanelProps) => {
  const hours = countByHour(rows, today)
  const total = hours.reduce((sum, count) => sum + count, 0)
  const byCourse = countByCourse(rows, today, courses)
  const max = Math.max(...byCourse.map((course) => course.count), 0)
  const capped = isCapped(rows)
  const caption = `시작 시각 기준 · ${total}회${capped ? ` · 최근 ${RECENT_COURSE_CAP}건 기준` : ''}`

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-panel-title font-semibold text-foreground">오늘 시간대별 순찰</h2>
          {state === 'ready' && <span className="text-caption text-muted-foreground tabular-nums">{caption}</span>}
        </div>
        {state !== 'ready' ? (
          <AreaFallback state={state} label="오늘 순찰" onRetry={onRetry} />
        ) : total === 0 ? (
          <p className="py-6 text-center text-caption text-muted-foreground">오늘 시작한 순찰이 없습니다</p>
        ) : (
          <div className="h-[150px]" role="img" aria-label={`오늘 시간대별 순찰 — 모두 ${total}회`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hours.map((count, hour) => ({ hour, count }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="hour"
                  ticks={HOUR_TICKS}
                  tickFormatter={(hour: number) => `${hour}시`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip cursor={{ fill: 'var(--muted)' }} content={<HourTooltip />} />
                <Bar dataKey="count" radius={4} isAnimationActive={false}>
                  {hours.map((_, hour) => (
                    <Cell key={hour} fill="var(--point)" fillOpacity={hour === currentHour ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h2 className="text-panel-title font-semibold text-foreground">오늘 코스별 순찰</h2>
          {state === 'ready' && <span className="text-caption text-muted-foreground tabular-nums">{caption}</span>}
        </div>
        {state !== 'ready' ? (
          <AreaFallback state={state} label="오늘 순찰" onRetry={onRetry} />
        ) : byCourse.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted-foreground">오늘 시작한 순찰이 없습니다</p>
        ) : (
          <ul aria-label="오늘 코스별 순찰" className="flex flex-col">
            {byCourse.map((course) => (
              <li key={course.courseSeq} className="grid grid-cols-[minmax(0,130px)_1fr_auto] items-center gap-3 py-[7px]">
                <span className={course.count === 0 ? 'truncate text-muted-foreground' : 'truncate text-sub-foreground'}>
                  {course.courseName}
                </span>
                <span aria-hidden className="h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-point"
                    style={{ width: `${max > 0 ? (course.count / max) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-8 text-right text-caption text-muted-foreground tabular-nums">{course.count}회</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default TodaySummaryPanel
