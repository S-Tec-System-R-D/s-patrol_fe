import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import AppChartTooltip from '@/components/app/AppChartTooltip'
import { HISTORY_DAYS } from '@/features/course-history/lib/historyRange'
import { cn } from '@/lib/utils'

import { checkRatio, hourlyCounts, hourSpan, workerStats } from '../../lib/courseRunStats'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 코스 상세 오른쪽 카드 2종 — `spec 074` T1236(시안 `개선 · 코스 상세` 의 시간대별 순찰 · 근무자별).
 * 🔴 **받은 회차 목록만 센다** — 요청이 늘지 않는다(`courseRunStats.ts`).
 * 🔄 `spec 084`: 카드 상자를 없애고 영역 제목 + 내용으로. 시간대별은 Recharts 세로 막대(대시보드 `오늘 시간대별 순찰` 과 같은 모양).
 */

interface CardProps {
  rows: CourseHistoryRow[]
  isPending: boolean
}

const Shell = ({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-2.5">
    <span className="flex flex-wrap items-baseline gap-x-2">
      <h2 className="text-panel-title font-semibold">{title}</h2>
      <span className="text-caption text-muted-foreground">{meta}</span>
    </span>
    {children}
  </section>
)

const Pending = () => <div className="h-24 animate-pulse rounded-md bg-muted" />

const HOUR_TICKS = [0, 6, 12, 18, 23]
const pad = (hour: number) => String(hour).padStart(2, '0')

const HourTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { hour: number; count: number } }[] }) => {
  const item = active ? payload?.[0]?.payload : undefined
  if (!item) return null
  return (
    <AppChartTooltip
      title={`${pad(item.hour)}:00 – ${pad(item.hour)}:59`}
      rows={[{ label: '순찰', value: item.count > 0 ? `${item.count}회` : '기록 없음' }]}
    />
  )
}

/**
 * 시작 시각별 회차 수 — **가장 많은 시만 진하게**(사용자 결정 2026-11-13) · 6시간 눈금 · 막대마다 말풍선.
 * 🔄 `spec 084`: 직접 그리던 막대 → Recharts(가로 격자만 · 축 선 없음 · 둥근 막대 · 차트 카드 말풍선).
 */
export const CourseHourlyCard = ({ rows, isPending }: CardProps) => {
  const counts = hourlyCounts(rows)
  const peak = Math.max(...counts)
  const peakHour = peak > 0 ? counts.indexOf(peak) : null
  const span = hourSpan(counts)

  return (
    <Shell title="시간대별 순찰" meta={`시작 시각 기준 · 최근 ${HISTORY_DAYS}일 · ${rows.length}회`}>
      {isPending ? (
        <Pending />
      ) : !span ? (
        <p className="py-6 text-center text-caption text-muted-foreground">순찰 기록이 없습니다</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="h-[130px] [&_*:focus]:outline-none" role="img" aria-label="시작 시각별 회차 수">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={counts.map((count, hour) => ({ hour, count }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="hour"
                  ticks={HOUR_TICKS}
                  interval={0}
                  tickFormatter={(hour: number) => `${hour}시`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip cursor={{ fill: 'var(--muted)' }} content={<HourTooltip />} />
                <Bar dataKey="count" radius={4} isAnimationActive={false}>
                  {counts.map((_, hour) => (
                    <Cell key={hour} fill="var(--point)" fillOpacity={hour === peakHour ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-0.5 text-caption text-muted-foreground">
            <p>
              순찰 시간대 <span className="font-medium text-foreground">{span.active}</span>
              {span.empty && ` · ${span.empty} 기록 없음`}
            </p>
            {peakHour !== null && (
              <p>
                가장 많은 시간 <span className="font-medium text-foreground tabular-nums">{pad(peakHour)}시</span> · {peak}회
              </p>
            )}
          </div>
        </div>
      )}
    </Shell>
  )
}

export const CourseWorkerCard = ({ rows, isPending }: CardProps) => {
  const stats = workerStats(rows)

  return (
    <Shell title="근무자별" meta={`최근 ${HISTORY_DAYS}일`}>
      {isPending ? (
        <Pending />
      ) : stats.length === 0 ? (
        <p className="py-6 text-center text-caption text-muted-foreground">순찰 기록이 없습니다</p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul aria-label="근무자별 순찰" className="flex flex-col">
            {stats.map((stat) => {
              const ratio = checkRatio(stat.checked, stat.points)
              const none = stat.userSeq === null
              return (
                <li
                  key={stat.userSeq ?? 'none'}
                  className="flex items-center gap-3 border-b border-border py-[9px] last:border-0"
                >
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate',
                      none ? 'text-muted-foreground' : 'font-medium text-foreground'
                    )}
                  >
                    {stat.userName ?? '근무자 없음'}
                  </span>
                  <span className="text-right text-caption whitespace-nowrap text-muted-foreground tabular-nums">
                    {stat.runs}회{stat.handovers > 0 && ` · 교대 ${stat.handovers}`}
                  </span>
                  <span aria-hidden className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                    <span
                      /* 인증 비율 막대는 메인 포인트색 하나(2026-11-16 사용자 결정 — 색 수를 줄인다) */
                      className="block h-full rounded-full bg-point"
                      style={{ width: `${(ratio ?? 0) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-caption font-medium tabular-nums">
                    {ratio === null ? '-' : `${Math.round(ratio * 100)}%`}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-caption text-muted-foreground">
            인증률은 혼자 끝낸 회차 기준 · 교대 회차는 회차 수에만 포함
          </p>
        </div>
      )}
    </Shell>
  )
}
