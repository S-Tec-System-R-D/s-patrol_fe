import { useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleDashedIcon,
  CircleMinusIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import AppEmpty from '@/components/app/AppEmpty'
import { pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryRow } from '@/features/course-history/types'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import { groupHistoryByDay, type PatrolDayBucket, type PatrolSummary } from '../../lib/patrolSummary'

/**
 * 지점 상세 **인증 기록** — 활동 타임라인 (`spec 076` 시안 개선 B).
 *
 * 요약 3칸(인증 n/m · 미인증 · 최근 순찰) → 14일 **쌓은 막대**(인증 · 미인증) → **날짜별 묶음** 목록.
 * 🔄 `미완료` → `건너뜀`(077) → **`미인증` · 주황**(`spec 079` D8 — 서버 상태 3 하나를 화면 어디서나 한 이름으로).
 * 데이터는 그대로 `GetPointHistory` 한 번(14일 · 100건 상한)이다.
 *
 * - 🔴 **막대를 누르면 그날만** 보인다 — 한 번 더 누르거나 `전체 보기` 로 풀린다.
 * - 🔄 **행 상태는 순찰이력 화면과 같은 뱃지**(`pointCheckBadge` — 이상없음 · 순찰기록 · 미완료 ·
 *   미인증 · 순찰제외 · 진행중 · 대기중, 사용자 결정 2026-11-13). 시안의 `인증/누락` 을 쓰면 같은
 *   기록이 지점 인증 상세에서는 `미완료` 로 보여 화면마다 이름이 달랐다. 미완료 행의
 *   `checkDt` 는 인증 시각이 아니라(OQ-15) 시각 칸을 `—` 로 둔다.
 * - 🔴 **행 → 지점 인증 상세**(D1). 시안의 회차 상세 모달은 `historySeq` 가 없어 못 연다(037 US4).
 * - 코스명은 행마다 옅게 둔다 — 소속 코스가 여러 개일 수 있다(시안은 "반복 제거" 라 했지만
 *   코스가 둘 이상이면 어느 코스 순찰인지 사라진다).
 */

const STATUS = { EXCLUDED: 2, MISSED: 3, DONE: 4 } as const

/** 행 앞 아이콘 — 눈으로 훑는 용도. 이름은 오른쪽 뱃지가 말한다(`pointCheckBadge`) */
const statusIcon = (row: PointHistoryRow) => {
  if (row.status === STATUS.DONE) return { icon: CheckCircle2Icon, className: 'text-success' }
  if (row.status === STATUS.MISSED) return { icon: CircleAlertIcon, className: 'text-muted-foreground' }
  if (row.status === STATUS.EXCLUDED) return { icon: CircleMinusIcon, className: 'text-muted-foreground' }
  return { icon: CircleDashedIcon, className: 'text-muted-foreground' }
}

/** 정상 인증(완료 · 메모 없음) — 뱃지 없이 아이콘만 */
const isPlain = (row: PointHistoryRow) => row.status === STATUS.DONE && !row.hasMemo

const timeOf = (row: PointHistoryRow): string => {
  // 🔴 인증한 행만 시각을 적는다 — 미완료의 checkDt 는 인증 시각이 아니다(OQ-15)
  if (row.status !== STATUS.DONE) return '—'
  const parsed = parseISO(row.checkDt)
  return isValid(parsed) ? format(parsed, 'HH:mm') : '—'
}

const dayLabel = (date: string) => format(parseISO(date), 'MM.dd')
/** 요일 한 글자 — locale 묶음을 들이지 않으려고 직접 고른다 */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const weekday = (date: string) => `(${WEEKDAYS[parseISO(date).getDay()]})`

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: PatrolDayBucket }[] }) => {
  if (!active || !payload?.length) return null
  const { date, count, missed } = payload[0].payload
  return (
    <div className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-caption shadow-sm">
      <p className="text-muted-foreground">{format(parseISO(date), 'yyyy.MM.dd')}</p>
      <p className="font-semibold text-foreground">
        인증 {count}
        {missed > 0 && <span className="text-muted-foreground"> · 미인증 {missed}</span>}
      </p>
    </div>
  )
}

const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-caption text-muted-foreground">{label}</span>
    <span className="text-xl font-bold tabular-nums text-foreground">{children}</span>
  </div>
)

interface PointActivityCardProps {
  summary: PatrolSummary
  /** `9시간 전` 같은 경과 표기. 기록이 없거나 미래 시각이면 `null` */
  sinceLabel: string | null
  rows: PointHistoryRow[]
  today: Date
  isPending: boolean
}

const PointActivityCard = ({ summary, sinceLabel, rows, today, isPending }: PointActivityCardProps) => {
  /** 막대로 고른 날 — `null` 이면 14일 전체 */
  const [selected, setSelected] = useState<string | null>(null)

  const groups = groupHistoryByDay(rows, today).filter((group) => !selected || group.date === selected)
  const rate = summary.attempted > 0 ? Math.round((summary.total / summary.attempted) * 100) : null
  const toggle = (date: string) => setSelected((prev) => (prev === date ? null : date))

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="flex items-baseline gap-2">
          <span className="text-panel-title font-semibold text-foreground">인증 기록</span>
          <span className="text-caption text-muted-foreground">최근 14일</span>
        </span>
        <Link
          to={paths.service.patrolPoints}
          className="inline-flex shrink-0 items-center gap-0.5 text-caption text-muted-foreground hover:text-foreground"
        >
          전체 기록
          <ChevronRightIcon size={13} aria-hidden />
        </Link>
      </div>

      {isPending ? (
        <div className="h-[220px] animate-pulse rounded-sm bg-muted" />
      ) : summary.attempted === 0 ? (
        /* 🔴 기능은 있고 데이터가 없는 것 — placeholder 가 아니다 */
        <AppEmpty
          illustration="route"
          title="순찰 기록이 없습니다"
          description="코스에 배정된 뒤 근무자가 인증하면 이곳에 날짜별로 표시됩니다."
        />
      ) : (
        <>
          {/* 🔴 인증률에 색을 입히지 않는다 — 분모를 확신할 수 없다(`spec 023`) */}
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <Stat label="인증">
              {summary.total}/{summary.attempted}
              {rate !== null && <span className="ml-1.5 text-caption font-semibold text-muted-foreground">{rate}%</span>}
            </Stat>
            <Stat label="미인증">{summary.missed}</Stat>
            <Stat label="최근 순찰">{sinceLabel ?? '-'}</Stat>
          </div>

          {/* 🔴 막대를 누르면 recharts 가 차트 전체에 포커스 테두리를 그린다 — 막대 색 변화로 충분해 지운다 */}
          <div className="h-[170px] w-full [&_*:focus]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.buckets} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="2 4" />
                <XAxis
                  dataKey="date"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string) => format(parseISO(value), 'dd')}
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.6 }} />
                {/* 🔴 쌓기 — 인증(파랑) 위에 미인증(주황 — 행 뱃지 · 대시보드와 같은 색). 고른 날 말고는 흐리게 */}
                <Bar
                  dataKey="count"
                  stackId="day"
                  maxBarSize={22}
                  className="cursor-pointer"
                  onClick={(data: { payload?: PatrolDayBucket }) => data.payload && toggle(data.payload.date)}
                  isAnimationActive={false}
                >
                  {summary.buckets.map((bucket) => (
                    <Cell
                      key={bucket.date}
                      fill="var(--color-point)"
                      fillOpacity={selected && selected !== bucket.date ? 0.25 : 1}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="missed"
                  stackId="day"
                  maxBarSize={22}
                  radius={[2, 2, 0, 0]}
                  className="cursor-pointer"
                  onClick={(data: { payload?: PatrolDayBucket }) => data.payload && toggle(data.payload.date)}
                  isAnimationActive={false}
                >
                  {summary.buckets.map((bucket) => (
                    <Cell
                      key={bucket.date}
                      fill="var(--color-muted-foreground)"
                      fillOpacity={selected && selected !== bucket.date ? 0.25 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-3 text-caption text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-xs bg-point" aria-hidden />
              인증
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-xs bg-muted-foreground" aria-hidden />
              미인증
            </span>
            <span className="ml-auto">
              {selected ? (
                <>
                  {dayLabel(selected)}만 표시 ·{' '}
                  <button type="button" className="font-medium text-point hover:underline" onClick={() => setSelected(null)}>
                    전체 보기
                  </button>
                </>
              ) : (
                '최근 14일 전체 · 막대를 누르면 해당 일자만 표시'
              )}
            </span>
          </div>

          {groups.length === 0 ? (
            <p className="py-6 text-center text-body text-muted-foreground">이 날은 기록이 없습니다.</p>
          ) : (
            <div className="flex flex-col">
              {groups.map((group) => (
                <section key={group.date} aria-label={`${dayLabel(group.date)} 기록`} className="border-b border-border/60 last:border-0">
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <span className="text-body font-semibold tabular-nums">{dayLabel(group.date)}</span>
                    <span className="text-caption text-muted-foreground">
                      {weekday(group.date)} · {group.rows.length}회
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {group.rows.map((row) => {
                      const status = statusIcon(row)
                      const badge = pointCheckBadge(row.status, row.hasMemo)
                      return (
                        <li key={row.detailSeq}>
                          <Link
                            to={paths.service.patrolPointDetail(row.detailSeq)}
                            className="group -mx-2 flex items-center gap-3 rounded-sm px-2 py-2.5 hover:bg-muted/50"
                          >
                            <span className="w-11 shrink-0 text-body tabular-nums text-muted-foreground">{timeOf(row)}</span>
                            <status.icon size={14} className={cn('shrink-0', status.className)} aria-hidden />
                            <span className="flex min-w-0 flex-1 items-baseline gap-2">
                              <span className="shrink-0 text-body font-semibold">{row.userName || '근무자 없음'}</span>
                              <span className="min-w-0 truncate text-caption text-muted-foreground">{row.courseName}</span>
                            </span>
                            {/* 🔴 **`이상없음` 은 뱃지를 달지 않는다**(사용자 결정 2026-11-13) — 정상이 대부분이라
                                같은 뱃지가 줄마다 반복되면 뱃지가 아무것도 알리지 못한다. 초록 체크 아이콘이 이미 말한다 */}
                            {!isPlain(row) && (
                              <AppBadge variant={badge.variant} className={cn('shrink-0', cardBadge)}>
                                {badge.label}
                              </AppBadge>
                            )}
                            <ChevronRightIcon size={14} className="shrink-0 text-muted-foreground/60 group-hover:text-foreground" aria-hidden />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default PointActivityCard
