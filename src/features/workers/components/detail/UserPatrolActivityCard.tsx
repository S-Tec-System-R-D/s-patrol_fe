import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronRightIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

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
 * 요약 4칸(`순찰 · 미완료 · 시간초과 · 지점 인증` — 회차 숫자 먼저 · 특이사항은 회차 줄 표시로 옮겼다) → 14일 막대(누르면 그 날만 — URL `?day=`) → 날짜별 **회차** 줄(펼치면 지점별).
 * 🔴 **요약과 차트가 같은 숫자를 말한다**(D14) — 막대 높이의 합 = `순찰` · 회색 부분의 합 = `미완료` ·
 *    막대 위 빨간 숫자의 합 = `시간초과`. 상태(완료 / 미완료)는 막대 색, 시간초과는 막대 위 숫자 — 둘은 겹칠 수 있는
 *    다른 기준이라 한 막대에 색으로 함께 쌓지 않는다. 진행 중 회차는 요약 · 차트에서 뺀다(목록에는 나온다).
 * 🔴 날짜 머리 · 막대에 **회차 수 숫자를 적지 않는다**(D1) — 높이가 말한다. 시간초과 수는 높이로 알 수 없어 적는다.
 * 🔴 `미인증` 은 **지점에만** 쓴다 — 요약 · 회차 줄에는 적지 않는다(D13: 요약의 `미인증 지점` 칸을 뺐다).
 * 🔴 인증 %에 색을 입히지 않는다 — `pointCount` 가 순찰제외를 뺀 값인지 미확인(api-spec 15).
 */

const DAY_PARAM = 'day'

const COLORS = {
  completed: 'var(--point)',
  incomplete: 'var(--muted-foreground)',
} as const

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: RunDayBucket }[] }) => {
  if (!active || !payload?.length) return null
  const { date, completed, incomplete, overtime } = payload[0].payload
  const total = completed + incomplete
  // 🔴 **합계 → 내역(색 네모) → 구분선 → 시간초과**(사용자 결정 2026-11-17) — `완료 1 · 미완료 1 · 시간초과 1` 로 한 줄에
  // 늘어놓으면 3회로 읽힌다. 시간초과는 완료 · 미완료에 겹쳐 세는 수라 색 네모 없이 구분선 아래에 따로 둔다
  return (
    <div className="min-w-[120px] rounded-sm border border-border bg-card px-2.5 py-1.5 text-caption shadow-sm">
      <p className="text-muted-foreground">{format(parseISO(date), 'yyyy.MM.dd')}</p>
      {total === 0 ? (
        <p className="font-semibold text-foreground">기록 없음</p>
      ) : (
        <>
          <TipRow label="순찰" value={`${total}회`} className="font-semibold text-foreground" />
          {completed > 0 && <TipRow color={COLORS.completed} label="완료" value={completed} />}
          {incomplete > 0 && <TipRow color={COLORS.incomplete} label="미완료" value={incomplete} />}
          {overtime > 0 && (
            <TipRow label="시간초과" value={overtime} className="mt-1 border-t border-border pt-1 font-medium text-danger" />
          )}
        </>
      )}
    </div>
  )
}

/** 툴팁 한 줄 — 이름 왼쪽 · 값 오른쪽. `color` 가 있으면 막대 색 네모를 붙인다(막대를 이루는 값) */
const TipRow = ({
  label,
  value,
  color,
  className,
}: {
  label: string
  value: React.ReactNode
  color?: string
  className?: string
}) => (
  <p className={cn('flex items-center justify-between gap-4 text-muted-foreground', className)}>
    <span className="inline-flex items-center gap-1.5">
      {color && <span className="size-2 rounded-xs" style={{ background: color }} aria-hidden />}
      {label}
    </span>
    <span className="tabular-nums">{value}</span>
  </p>
)

/** 상자 없는 한 줄 숫자의 한 칸 — `이름 **값** 덧말`. 칸 사이는 세로 선(지점 상세와 같은 모양 — `spec 084`) */
const Stat = ({ label, value, note, danger }: { label: string; value: React.ReactNode; note?: React.ReactNode; danger?: boolean }) => (
  <div className="flex items-baseline gap-1.5 border-l border-border pr-1 pl-4 text-[12px] text-muted-foreground first:border-l-0 first:pl-0">
    {label}
    <span className={cn('text-[18px] font-semibold tabular-nums', danger ? 'text-danger' : 'text-foreground')}>{value}</span>
    {note && <span className="tabular-nums">{note}</span>}
  </div>
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
  const bar = (key: keyof typeof COLORS) => (
    <Bar
      dataKey={key}
      stackId="day"
      radius={2}
      className="cursor-pointer"
      onClick={onBar}
      isAnimationActive={false}
    >
      {buckets.map((bucket) => (
        <Cell
          key={bucket.date}
          fill={COLORS[key]}
          // 옅게 깔고 **고른 날만 진하게**(고르지 않았으면 오늘) — 지점 상세와 같다
          fillOpacity={bucket.date === (selected ?? todayKey) ? (key === 'completed' ? 1 : 0.6) : key === 'completed' ? 0.35 : 0.4}
        />
      ))}

    </Bar>
  )

  return (
    <section className="flex min-w-0 flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="flex items-baseline gap-2">
          <h2 className="text-panel-title font-semibold text-foreground">순찰 기록</h2>
          <span className="text-caption text-muted-foreground">최근 14일 · 막대를 누르면 해당 일자만 표시</span>
        </span>
        {/* 코스 순찰이력 — 순찰자 이름 · 같은 기간을 걸어 보낸다(목록은 이름 부분 검색이라 동명이인이 섞일 수 있다) */}
        <Link
          to={allHref}
          className="inline-flex shrink-0 items-center gap-0.5 text-caption font-medium text-point hover:underline"
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
      ) : runs.runs.length === 0 ? (
        <p className="py-6 text-center text-caption text-muted-foreground">순찰 기록이 없습니다</p>
      ) : (
        <>
          <div role="group" aria-label="순찰 요약" className="flex flex-wrap gap-y-2">
            <Stat label="순찰" value={summary.runs} note="회" />
            <Stat label="미완료" value={summary.incomplete} note="회" />
            <Stat label="시간초과" value={summary.overtime} note="회" danger={summary.overtime > 0} />
            <Stat label="지점 인증" value={rate !== null ? `${rate}%` : '-'} note={`${summary.checked}/${summary.points}`} />
          </div>

          {/* 🔴 막대를 누르면 recharts 가 차트 전체에 포커스 테두리를 그린다 — 막대 색 변화로 충분해 지운다(076) */}
          <div className="h-[100px] w-full [&_*:focus]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={4}>
                <XAxis
                  dataKey="date"
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) => (value === todayKey ? '오늘' : `${format(parseISO(value), 'd')}일`)}
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
                {bar('completed')}
                {bar('incomplete')}
                {/* 🔄 `spec 084`(목업 `14`): 막대 위 시간초과 수를 없앴다 — 위의 한 줄 숫자와 말풍선이 말한다 */}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {selected && (
            <p className="text-caption text-muted-foreground">
              {formatRunDay(selected)} 기록 ·{' '}
              <button type="button" className="font-medium text-point hover:underline" onClick={() => selectDay(null)}>
                전체 보기
              </button>
            </p>
          )}

          {groups.length === 0 ? (
            <p className="py-6 text-center text-body text-muted-foreground">
              {selected ? `${formatRunDay(selected)} 순찰 기록 없음` : '순찰 기록 없음'}
            </p>
          ) : (
            <div className="flex flex-col">
              {groups.map((group) => {
                return (
                  <section key={group.date} aria-label={`${formatRunDay(group.date)} 기록`} className="mt-3.5 first:mt-0">
                    <div className="flex h-[30px] items-center gap-2 border-b border-border">
                      {/* 🔴 회차 수 · 예외 수를 적지 않는다(D1 · D5) — 예외는 아래 회차 줄에 있다 */}
                      <h4 className="text-caption font-normal text-muted-foreground tabular-nums">{formatRunDay(group.date)}</h4>
                      {group.date === todayKey && <span className="text-caption font-medium text-point">오늘</span>}
                    </div>
                    <ul className="flex flex-col">
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
