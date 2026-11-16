import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronRightIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import AppEmpty from '@/components/app/AppEmpty'
import { recentRange } from '@/features/course-history/lib/historyRange'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import { useUserPatrolRuns } from '../../hooks/useUserPatrolRuns'
import {
  formatRunDay,
  groupRunsByDay,
  RUN_DAYS,
  runDayBuckets,
  summarizeRuns,
  type RunDayBucket,
} from '../../lib/userPatrolRuns'
import UserRunRow from './UserRunRow'

/**
 * 근무자 상세 오른쪽 **순찰 기록** (`spec 079`, 시안 `개선안/근무자` — 지점 상세 B 패턴).
 *
 * 요약 5칸 → 14일 막대(누르면 그 날만 — URL `?day=`) → 날짜별 **회차** 줄(펼치면 지점별).
 * 🔴 날짜 머리 · 막대에 **회차 수 숫자를 적지 않는다**(D1) — 높이가 말한다. 합계는 요약 `순찰 n회` 하나.
 * 🔴 용어는 `미완료 포함`(회차) · `건너뜀` / `미인증`(지점)이다(D2) — 시안의 `누락` 은 쓰지 않는다.
 * 🔴 인증 %에 색을 입히지 않는다 — `pointCount` 가 순찰제외를 뺀 값인지 미확인(api-spec 15).
 */

const DAY_PARAM = 'day'

const COLORS = {
  normal: 'var(--color-point)',
  overtime: 'var(--color-danger)',
  incomplete: 'var(--color-warning)',
} as const

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: RunDayBucket }[] }) => {
  if (!active || !payload?.length) return null
  const { date, normal, overtime, incomplete } = payload[0].payload
  const parts = [
    normal > 0 ? `정상 ${normal}` : null,
    overtime > 0 ? `시간초과 ${overtime}` : null,
    incomplete > 0 ? `미완료 포함 ${incomplete}` : null,
  ].filter(Boolean)
  return (
    <div className="rounded-sm border border-border bg-card px-2.5 py-1.5 text-caption shadow-sm">
      <p className="text-muted-foreground">{format(parseISO(date), 'yyyy.MM.dd')}</p>
      <p className="font-semibold text-foreground">{parts.length > 0 ? parts.join(' · ') : '기록 없음'}</p>
    </div>
  )
}

const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-caption text-muted-foreground">{label}</span>
    <span className="text-xl font-bold tabular-nums text-foreground">{children}</span>
  </div>
)

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="size-2 rounded-xs" style={{ background: color }} aria-hidden />
    {label}
  </span>
)

interface UserPatrolActivityCardProps {
  userSeq: number
  userName: string
  siteSeq: number | null
}

const UserPatrolActivityCard = ({ userSeq, userName, siteSeq }: UserPatrolActivityCardProps) => {
  // 🔴 기준일을 렌더마다 새로 만들지 않는다 — queryKey 가 바뀌어 무한 재조회가 된다
  const today = useMemo(() => new Date(), [])
  const todayKey = format(today, 'yyyy-MM-dd')
  const runs = useUserPatrolRuns(siteSeq, userSeq, userName, today)
  const [searchParams, setSearchParams] = useSearchParams()
  const selected = searchParams.get(DAY_PARAM)
  const [open, setOpen] = useState<Set<number>>(() => new Set())

  const summary = summarizeRuns(runs.runs)
  const buckets = runDayBuckets(runs.runs, today)
  const groups = groupRunsByDay(runs.runs).filter((group) => !selected || group.date === selected)
  const rate = summary.points > 0 ? Math.round((summary.checked / summary.points) * 100) : null

  const selectDay = (date: string | null) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (date === null || prev.get(DAY_PARAM) === date) next.delete(DAY_PARAM)
        else next.set(DAY_PARAM, date)
        return next
      },
      { replace: true }
    )

  const toggle = (historySeq: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(historySeq)) next.delete(historySeq)
      else next.add(historySeq)
      return next
    })

  const range = recentRange(today, RUN_DAYS)
  const allHref = `${paths.service.patrolZones}?${new URLSearchParams({ user: userName, from: range.fromDt, to: range.toDt })}`

  const onBar = (data: { payload?: RunDayBucket }) => data.payload && selectDay(data.payload.date)
  const bar = (key: keyof typeof COLORS, top: boolean) => (
    <Bar
      dataKey={key}
      stackId="day"
      maxBarSize={22}
      radius={top ? [2, 2, 0, 0] : undefined}
      className="cursor-pointer"
      onClick={onBar}
      isAnimationActive={false}
    >
      {buckets.map((bucket) => (
        <Cell key={bucket.date} fill={COLORS[key]} fillOpacity={selected && selected !== bucket.date ? 0.25 : 1} />
      ))}
    </Bar>
  )

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="flex items-baseline gap-2">
          <span className="text-panel-title font-semibold text-foreground">순찰 기록</span>
          <span className="text-caption text-muted-foreground">최근 14일</span>
        </span>
        {/* 코스 순찰이력 — 순찰자 이름 · 같은 기간을 걸어 보낸다(목록은 이름 부분 검색이라 동명이인이 섞일 수 있다) */}
        <Link
          to={allHref}
          className="inline-flex shrink-0 items-center gap-0.5 text-caption text-muted-foreground hover:text-foreground"
        >
          전체 기록
          <ChevronRightIcon size={13} aria-hidden />
        </Link>
      </div>

      {runs.isPending && siteSeq !== null ? (
        <div className="h-[260px] animate-pulse rounded-sm bg-muted" />
      ) : runs.isError ? (
        /* 🔴 조회 실패를 "기록 없음" 으로 보이지 않는다 */
        <AppEmpty
          icon={TriangleAlertIcon}
          title="순찰 기록을 불러오지 못했습니다"
          description={runs.error?.message}
        />
      ) : summary.runs === 0 ? (
        <AppEmpty
          illustration="route"
          title="순찰 기록이 없습니다"
          description="최근 14일 동안 이 사업장에서 순찰한 회차가 없습니다."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <Stat label="순찰">{summary.runs}회</Stat>
            <Stat label="지점 인증">
              {rate !== null ? `${rate}%` : '-'}
              <span className="ml-1.5 text-caption font-semibold text-muted-foreground">
                {summary.checked}/{summary.points}
              </span>
            </Stat>
            <Stat label="미완료 포함">
              <span className={cn(summary.incomplete > 0 && 'text-warning-foreground')}>{summary.incomplete}회</span>
            </Stat>
            <Stat label="특이사항">{summary.memo}회</Stat>
            <Stat label="시간초과">
              <span className={cn(summary.overtime > 0 && 'text-danger')}>{summary.overtime}회</span>
            </Stat>
          </div>

          {/* 🔴 막대를 누르면 recharts 가 차트 전체에 포커스 테두리를 그린다 — 막대 색 변화로 충분해 지운다(076) */}
          <div className="h-[170px] w-full [&_*:focus]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -28 }}>
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
                {bar('normal', false)}
                {bar('overtime', false)}
                {bar('incomplete', true)}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-3 text-caption text-muted-foreground">
            <Legend color={COLORS.normal} label="정상" />
            <Legend color={COLORS.overtime} label="시간초과" />
            <Legend color={COLORS.incomplete} label="미완료 포함" />
            <span className="text-muted-foreground/80">둘 다면 미완료 포함</span>
            <span className="ml-auto">
              {selected ? (
                <>
                  {formatRunDay(selected)} 기록 ·{' '}
                  <button type="button" className="font-medium text-point hover:underline" onClick={() => selectDay(null)}>
                    전체 보기
                  </button>
                </>
              ) : (
                '최근 14일 전체 · 막대를 누르면 해당 일자만 표시'
              )}
            </span>
          </div>

          {groups.length === 0 ? (
            <p className="py-6 text-center text-body text-muted-foreground">
              {selected ? `${formatRunDay(selected)} 순찰 기록 없음` : '순찰 기록 없음'}
            </p>
          ) : (
            <div className="flex flex-col">
              {groups.map((group) => {
                return (
                  <section key={group.date} aria-label={`${formatRunDay(group.date)} 기록`} className="border-b border-border/60 last:border-0">
                    <div className="flex items-center gap-2 pt-3 pb-1">
                      {/* 🔴 회차 수 · 예외 수를 적지 않는다(D1 · D5) — 예외는 아래 회차 줄에 있다 */}
                      <h4 className="text-body font-semibold tabular-nums">{formatRunDay(group.date)}</h4>
                      {group.date === todayKey && <span className="text-caption font-medium text-point">오늘</span>}
                    </div>
                    <ul className="flex flex-col gap-0.5 pb-2">
                      {group.rows.map((row) => (
                        <UserRunRow
                          key={row.historySeq}
                          row={row}
                          userSeq={userSeq}
                          open={open.has(row.historySeq)}
                          onToggle={() => toggle(row.historySeq)}
                        />
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default UserPatrolActivityCard
