import { format, isValid, parseISO } from 'date-fns'
import { CheckCircle2Icon, ClockIcon, FootprintsIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'

import { formatDuration } from '@/features/course-history/lib/elapsed'
import { formatRate, type CourseHistoryStats } from '@/features/course-history/lib/courseHistoryStats'
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
}

const formatLastRun = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : value
}

const CourseKpiRow = ({ stats }: CourseKpiRowProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:[&>:last-child]:col-span-2 xl:grid-cols-3 xl:[&>:last-child]:col-span-1">
    <AppKpiCard
      compact
      icon={FootprintsIcon}
      label="마지막 순찰"
      value={stats.lastRunDt ? formatLastRun(stats.lastRunDt) : '-'}
      /* 🔴 **"얼마 전" 이 시각보다 먼저 읽힌다** — 지점 상세와 같은 표기다 */
      aside={
        stats.lastRunDt && (
          <span className="text-body font-medium text-muted-foreground">
            {formatSinceLabel(stats.lastRunDt, new Date())}
          </span>
        )
      }
    />
    <AppKpiCard
      compact
      icon={ClockIcon}
      label="평균 소요시간"
      value={formatDuration(stats.avgElapsedSec)}
      /* 🔴 **`설정 +5분` 대신 서버가 판정한 초과 횟수다** — 기준 `totalMin` 은 구간시간 합과
         어긋난 코스가 있어 못 쓴다(OQ-031-B, B-31) */
      unit={stats.sampledCount > 0 ? `초과 ${stats.overtimeCount}/${stats.sampledCount}` : undefined}
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
      compact
      icon={CheckCircle2Icon}
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

export default CourseKpiRow
