import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HISTORY_DAYS } from '@/features/course-history/lib/historyRange'
import { cn } from '@/lib/utils'

import { checkRatio, hourlyCounts, hourSpan, workerStats } from '../../lib/courseRunStats'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 코스 상세 오른쪽 카드 2종 — `spec 074` T1236(시안 `개선 · 코스 상세` 의 시간대별 순찰 · 근무자별).
 * 🔴 **받은 회차 목록만 센다** — 요청이 늘지 않는다(`courseRunStats.ts`).
 */

interface CardProps {
  rows: CourseHistoryRow[]
  isPending: boolean
}

const Shell = ({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
    <span className="flex items-baseline gap-2">
      <h2 className="text-panel-title font-semibold">{title}</h2>
      <span className="text-caption text-muted-foreground">{meta}</span>
    </span>
    {children}
  </section>
)

const Pending = () => <div className="h-24 animate-pulse rounded-md bg-muted" />

const AXIS = [0, 6, 12, 18, 24]
const pad = (hour: number) => String(hour).padStart(2, '0')

/**
 * 🔄 사용자 결정 2026-11-13 — 시마다 **바탕 칸**을 깔고(빈 시간도 칸이 보인다) · **가장 많은 시만 진하게** ·
 * 6시간 눈금 · 막대마다 말풍선(`CourseRunCharts` 와 같은 Tooltip). 막대 사이 여백까지 마우스 영역이다.
 */
export const CourseHourlyCard = ({ rows, isPending }: CardProps) => {
  const counts = hourlyCounts(rows)
  const max = Math.max(...counts, 1)
  const peak = Math.max(...counts)
  const peakHour = peak > 0 ? counts.indexOf(peak) : null
  const span = hourSpan(counts)

  return (
    <Shell title="시간대별 순찰" meta={`최근 ${HISTORY_DAYS}일 · ${rows.length}회`}>
      {isPending ? (
        <Pending />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative">
            {/* 6시간 눈금 — 막대 뒤 */}
            <div aria-hidden className="pointer-events-none absolute inset-0 flex">
              {[0, 1, 2, 3].map((quarter) => (
                <span key={quarter} className="flex-1 border-l border-dashed border-border first:border-l-0" />
              ))}
            </div>
            <div className="relative flex h-24 items-stretch" role="img" aria-label="시작 시각별 회차 수">
              {counts.map((count, hour) => (
                <Tooltip key={hour}>
                  <TooltipTrigger asChild>
                    <span className="group flex flex-1 px-px">
                      <span className="relative block w-full overflow-hidden rounded-sm bg-muted/60">
                        {count > 0 && (
                          <span
                            className={cn(
                              'absolute inset-x-0 bottom-0 rounded-sm transition-opacity group-hover:opacity-100',
                              hour === peakHour ? 'bg-point' : 'bg-point/45 group-hover:bg-point/70'
                            )}
                            style={{ height: `${Math.max(count / max, 0.08) * 100}%` }}
                          />
                        )}
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="tabular-nums">
                    <p className="opacity-70">
                      {pad(hour)}:00 – {pad(hour)}:59
                    </p>
                    <p className="font-semibold">{count > 0 ? `${count}회` : '기록 없음'}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-label text-muted-foreground tabular-nums">
            {AXIS.map((hour) => (
              <span key={hour}>{hour === 24 ? '24시' : hour}</span>
            ))}
          </div>
          {span ? (
            <div className="flex flex-col gap-0.5 text-caption text-muted-foreground">
              <p>
                순찰 시간대 <span className="font-semibold text-foreground">{span.active}</span>
                {span.empty && ` · ${span.empty} 기록 없음`}
              </p>
              {peakHour !== null && (
                <p>
                  가장 많은 시간 <span className="font-semibold text-foreground tabular-nums">{pad(peakHour)}시</span> ·{' '}
                  {peak}회
                </p>
              )}
            </div>
          ) : (
            <p className="text-caption text-muted-foreground">순찰 기록이 없습니다</p>
          )}
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
        <p className="text-caption text-muted-foreground">순찰 기록이 없습니다</p>
      ) : (
        <div className="flex flex-col gap-2">
          <ul aria-label="근무자별 순찰" className="flex flex-col">
            {stats.map((stat) => {
              const ratio = checkRatio(stat.checked, stat.points)
              const none = stat.userSeq === null
              return (
                <li
                  key={stat.userSeq ?? 'none'}
                  className="flex items-center gap-3 border-b border-border py-2.5 text-body last:border-0"
                >
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate',
                      none ? 'text-muted-foreground' : 'font-semibold text-foreground'
                    )}
                  >
                    {stat.userName ?? '근무자 없음'}
                  </span>
                  <span className="text-right text-caption whitespace-nowrap text-muted-foreground tabular-nums">
                    {stat.runs}회{stat.handovers > 0 && ` · 교대 ${stat.handovers}`}
                  </span>
                  <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-muted-foreground/60"
                      style={{ width: `${(ratio ?? 0) * 100}%` }}
                    />
                  </span>
                  <span className="w-10 text-right text-caption font-semibold tabular-nums">
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
