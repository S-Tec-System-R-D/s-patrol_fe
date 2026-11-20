import { useId, type ReactElement } from 'react'
import { format, isValid, parseISO } from 'date-fns'

import AppChartTooltip from '@/components/app/AppChartTooltip'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/features/course-history/lib/elapsed'
import { RECENT_RUN_LIMIT, type RecentRun } from '@/features/course-history/lib/courseHistoryStats'

/**
 * KPI 칸 오른쪽 **최근 회차 미니 그래프**(사용자 결정 2026-11-06).
 *
 * 🔴 **왼쪽이 오래된 회차, 오른쪽이 최신이다.** 회차가 7개보다 적으면 왼쪽을 빈 칸으로 남긴다 —
 * 칸 수가 바뀌면 그래프 폭이 들쭉날쭉해지고, 없는 회차를 있는 것처럼 보이게 하지도 않는다.
 *
 * 🔴 **값이 없는 회차는 빈 칸이다**(진행 중이라 소요시간이 없거나 분모가 0). 0 높이로 그리면
 * "0분" · "0%" 로 읽힌다.
 *
 * 🔄 **`spec 084`**: 칸 폭 120 × 30 · 막대는 바탕 칸 없이 옅은 파랑(시간초과만 빨강) · 말풍선은 차트 카드
 * (`AppChartTooltip`) — 윗줄 **순찰 시작 일시**, 아랫줄 이름 + 값 · 단위(전에는 날짜와 값만 있었다).
 * 🔴 Recharts 로 옮기지 않았다 — 30px 높이의 그림이고 "7칸 고정 · 중앙값 2배 눈금" 규칙을 직접 쥐고 있다. 모양만 맞춘다.
 */

const padded = (runs: RecentRun[]): (RecentRun | null)[] => [
  ...Array<null>(Math.max(RECENT_RUN_LIMIT - runs.length, 0)).fill(null),
  ...runs,
]

const dateLabel = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : value
}

interface RunTipText {
  /** 순찰 시작 일시 */
  date: string
  /** 값의 이름 — `소요` · `인증률` */
  label: string
  /** 단위까지 붙인 값 */
  value: string
  color?: string
}

/** 회차 하나의 말풍선 — 차트 카드 */
const RunTip = ({ tip, children }: { tip: RunTipText; children: ReactElement }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent className="bg-transparent p-0">
      <AppChartTooltip title={tip.date} rows={[{ label: tip.label, value: tip.value, color: tip.color }]} />
    </TooltipContent>
  </Tooltip>
)

interface RunBarsProps {
  label: string
  bars: ({ ratio: number | null; color: string; tip: RunTipText } | null)[]
}

const RunBars = ({ label, bars }: RunBarsProps) => (
  <div className="flex h-[30px] w-[120px] items-end" role="img" aria-label={label}>
    {bars.map((bar, index) => {
      /* 🔴 **좌우 여백까지 마우스 영역이다** — 막대만 잡으면 맞추기 어렵다 */
      const slot = (
        <span key={index} className="h-full flex-1 px-[1.5px]">
          <span className="relative block h-full w-full">
            {bar && bar.ratio !== null && (
              <span
                className={cn('absolute inset-x-0 bottom-0 rounded-[3px]', bar.color)}
                style={{ height: `${Math.max(bar.ratio, 0.08) * 100}%` }}
              />
            )}
          </span>
        </span>
      )
      return bar ? (
        <RunTip key={index} tip={bar.tip}>
          {slot}
        </RunTip>
      ) : (
        slot
      )
    })}
  </div>
)

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * 회차별 소요시간. 🔴 기준을 넘긴 회차만 주황(서버 `overtimeYn`).
 *
 * 🔴 **막대 높이의 기준은 최댓값이 아니라 중앙값의 2배다.** 유난히 긴 회차 하나를 기준으로 삼으면
 * 나머지 막대가 바닥에 붙어 차이가 사라진다. 그보다 긴 회차는 칸을 꽉 채운다 — 실제 값은 말풍선에 있다.
 */
export const RunElapsedBars = ({ runs }: { runs: RecentRun[] }) => {
  const elapsed = runs.flatMap((run) => (run.elapsedSec === null ? [] : [run.elapsedSec]))
  const scale = elapsed.length === 0 ? 0 : Math.min(median(elapsed) * 2, Math.max(...elapsed))
  return (
    <RunBars
      label={`최근 ${runs.length}회 소요시간`}
      bars={padded(runs).map(
        (run) =>
          run && {
            ratio: run.elapsedSec === null || scale === 0 ? null : Math.min(run.elapsedSec / scale, 1),
            // 🔄 `spec 079` D11 — 시간초과는 빨강(주황은 미인증)
            color: run.overtime ? 'bg-danger' : 'bg-point opacity-35',
            tip: {
              date: dateLabel(run.startDt),
              label: '소요',
              value: `${formatDuration(run.elapsedSec)}${run.overtime ? ' · 시간초과' : ''}`,
              color: run.overtime ? 'var(--danger)' : undefined,
            },
          }
      )}
    />
  )
}

const CHART_W = 120
const CHART_H = 30
const CHART_PAD = 3

/**
 * 회차별 인증률 곡선 그래프 — 위가 100%, 아래가 0% 다.
 * 🔴 곡선의 조절점을 두 점의 가운데 x · 각 점의 y 에 둔다 — 값이 두 점 사이를 벗어나지 않아
 * 100% 위나 0% 아래로 튀지 않는다. 점은 최신 회차만 보이고, 회차마다 세로 칸 전체가 말풍선 영역이다.
 * 🔴 **색은 값과 상관없이 하나다**(🔄 `spec 084`: 하늘색 → 포인트 파랑 — 색 수를 줄인다). 분모를 확신할 수 없어 좋고 나쁨을 칠하지 않는다.
 * 🔴 분모가 0 인 회차는 점을 찍지 않고 건너뛴다 — 0% 로 그리면 없는 실패가 생긴다.
 */
export const RunAuthLine = ({ runs }: { runs: RecentRun[] }) => {
  const gradientId = useId()
  const step = (CHART_W - CHART_PAD * 2) / (RECENT_RUN_LIMIT - 1)
  const points = padded(runs).flatMap((run, index) =>
    run && run.pointCount > 0
      ? [
          {
            x: CHART_PAD + index * step,
            y: CHART_PAD + (1 - run.checkedCount / run.pointCount) * (CHART_H - CHART_PAD * 2),
            tip: {
              date: dateLabel(run.startDt),
              label: '인증률',
              value: `${Math.round((run.checkedCount / run.pointCount) * 100)}% · ${run.checkedCount}/${run.pointCount}`,
            },
          },
        ]
      : []
  )
  const curve = points
    .map((point, index) => {
      if (index === 0) return `M${point.x},${point.y}`
      const previous = points[index - 1]
      const middleX = (previous.x + point.x) / 2
      return `C${middleX},${previous.y} ${middleX},${point.y} ${point.x},${point.y}`
    })
    .join(' ')
  const first = points[0]
  const last = points[points.length - 1]

  return (
    <svg
      width={CHART_W}
      height={CHART_H}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="text-point"
      role="img"
      aria-label={`최근 ${runs.length}회 인증률`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      {points.length > 1 && (
        <>
          <path
            d={`${curve} L${last.x},${CHART_H} L${first.x},${CHART_H} Z`}
            fill={`url(#${gradientId})`}
          />
          <path
            d={curve}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {last && <circle cx={last.x} cy={last.y} r={2.5} fill="currentColor" />}
      {points.map((point) => (
        <RunTip key={point.x} tip={point.tip}>
          <rect x={point.x - step / 2} y={0} width={step} height={CHART_H} fill="transparent" />
        </RunTip>
      ))}
    </svg>
  )
}
