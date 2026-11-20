import { format, isValid, parseISO } from 'date-fns'

import AppKpiCard from '@/components/app/AppKpiCard'

import { formatDuration } from '@/features/course-history/lib/elapsed'
import { formatRate, type CourseHistoryStats } from '@/features/course-history/lib/courseHistoryStats'
import type { CourseHistoryRow } from '@/features/course-history/types'
import { formatSinceLabel } from '@/features/points/lib/patrolSummary'

import { RunAuthLine, RunElapsedBars } from './CourseRunCharts'

/**
 * 코스 KPI 3종 (`spec 023` → `spec 031` 공용 카드 → **사용자 결정 2026-11-06 재구성**).
 *
 * 🔴 **이 페이지의 판단(편성 · 구간시간)에 쓰이는 값만 둔다.** `30일 순찰 수행` 은 목표 횟수가
 * 없어 많고 적음을 알 수 없고 `최근 순찰 기록` 머리와 같은 값이라, `미인증 지점` 은 인증률 ·
 * 이상 이력과 겹쳐서 뺐다.
 *
 * 🔴🔴 **인증률 미달을 경고로 바꾸지 않는다.** 지점 상태에 **`순찰제외`(2)** 가 있고
 * `pointCount` 가 그것을 **빼고 센 값인지 미확인**이다. 순찰에서 빼기로 한 지점이 분모에
 * 있으면 **영원히 100% 가 안 되는 코스**가 생기고, 그걸 빨갛게 칠하면 관리자는 매번 없는
 * 문제를 찾는다. 그래프도 값에 따라 색을 바꾸지 않는다(한 색 고정).
 *
 * 🔴 **빈 상태를 "0" 으로 적지 않는다.** 이력이 아예 없으면 값은 `-` 다 —
 * `0분`·`0%` 로 적으면 "순찰했는데 결과가 0" 으로 읽힌다. **그때 바도 그리지 않는다.**
 */

interface CourseKpiRowProps {
  stats: CourseHistoryStats
  /** 가장 최근에 시작한 회차 — 진행 중이면 마지막 순찰 칸이 진행 표시로 바뀐다(`spec 084`) */
  latest?: CourseHistoryRow | null
}

const formatLastRun = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : value
}

const formatClock = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'HH:mm') : value
}

/** 시작부터 지금까지 — 시각을 읽을 수 없거나 미래면 `null` */
const elapsedSince = (startDt: string, now: Date): number | null => {
  const parsed = parseISO(startDt)
  if (!isValid(parsed)) return null
  const seconds = Math.floor((now.getTime() - parsed.getTime()) / 1000)
  return seconds < 0 ? null : seconds
}

/**
 * 진행 중 회차의 진행 — 막대 · `지점 4 / 8` · 경과(`spec 084` — 목업 `05-코스-상세`).
 * 🔴 경과는 **시작부터 지금까지**다 — 목록 응답의 소요시간은 끝난 회차의 값이라 진행 중에는 쓰지 않는다.
 */
const RunProgress = ({ row }: { row: CourseHistoryRow }) => {
  const elapsed = elapsedSince(row.startDt, new Date())
  const ratio = row.pointCount > 0 ? Math.min(row.checkedCount / row.pointCount, 1) : 0
  return (
    <div className="w-[120px]">
      <div aria-hidden className="h-[5px] overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-point" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mt-[5px] flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>
          지점 {row.checkedCount} / {row.pointCount}
        </span>
        {elapsed !== null && <span>{formatDuration(elapsed)}</span>}
      </div>
    </div>
  )
}

const CourseKpiRow = ({ stats, latest }: CourseKpiRowProps) => {
  // 🔴 진행 중(코스 상태 0)인 회차만 — 끝난 회차는 지금처럼 시각 + "얼마 전"
  const running = latest?.status === 0 ? latest : null
  const patrollers = running?.userList.map((user) => user.userName).join(', ')
  return (
  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:[&>:last-child]:col-span-2 xl:grid-cols-3 xl:[&>:last-child]:col-span-1">
    <AppKpiCard
      label="마지막 순찰"
      value={running ? formatClock(running.startDt) : stats.lastRunDt ? formatLastRun(stats.lastRunDt) : '-'}
      unit={
        running && <span className="font-medium text-point">진행 중{patrollers ? ` · ${patrollers}` : ''}</span>
      }
      aside={
        running ? (
          <RunProgress row={running} />
        ) : (
          stats.lastRunDt && (
            <span className="text-[12px] text-muted-foreground">{formatSinceLabel(stats.lastRunDt, new Date())}</span>
          )
        )
      }
    />
    <AppKpiCard
      label="평균 소요시간"
      value={formatDuration(stats.avgElapsedSec)}
      /* 🔴 **`설정 +5분` 대신 서버가 판정한 초과 횟수다** — 기준 `totalMin` 은 구간시간 합과
         어긋난 코스가 있어 못 쓴다(OQ-031-B, B-31) */
      unit={stats.sampledCount > 0 ? `시간초과 ${stats.overtimeCount}/${stats.sampledCount}` : undefined}
      /* 🔴 **회차별 막대가 평균의 안정성을 보여준다** — 평균만 있으면 "50분" 이 고른 값인지
         들쑥날쑥한 값인지 알 수 없다 */
      aside={stats.recentRuns.length > 0 && <RunElapsedBars runs={stats.recentRuns} />}
      foot={
        stats.minElapsedSec !== null && stats.maxElapsedSec !== null
          ? {
              left: `최단 ${formatDuration(stats.minElapsedSec)}`,
              right: `최장 ${formatDuration(stats.maxElapsedSec)}`,
            }
          : undefined
      }
    />
    <AppKpiCard
      label="지점 인증률"
      value={formatRate(stats.authRate)}
      /* 분자·분모를 그대로 보여 준다 — 비율만 있으면 "몇 건 중 몇 건" 을 알 수 없다 */
      unit={stats.pointSum > 0 ? `${stats.checkedSum}/${stats.pointSum}` : undefined}
      /* `authRate` 가 `null`(분모 0)이면 그리지 않는다 */
      aside={stats.authRate !== null && <RunAuthLine runs={stats.recentRuns} />}
      // 🔴 tone 을 비율에 따라 바꾸지 않는다 — 위 블록 주석(순찰제외)
    />
  </div>
  )
}

export default CourseKpiRow
