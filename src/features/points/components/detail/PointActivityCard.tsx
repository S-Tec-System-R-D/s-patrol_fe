import { useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import AppChartTooltip from '@/components/app/AppChartTooltip'
import { pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryRow } from '@/features/course-history/types'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import { formatSinceLabel, groupHistoryByDay, type PatrolDayBucket, type PatrolSummary } from '../../lib/patrolSummary'

/**
 * 지점 상세 **인증 기록** — 활동 타임라인 (`spec 076` 시안 개선 B).
 *
 * 요약 3칸(인증 n/m · 미인증 · 최근 순찰) → 14일 **쌓은 막대**(인증 · 미인증) → **날짜별 묶음** 목록.
 * 🔄 `미완료` → `건너뜀`(077) → **`미인증` · 주황**(`spec 079` D8 — 서버 상태 3 하나를 화면 어디서나 한 이름으로).
 * 데이터는 그대로 `GetPointHistory` 한 번(14일 · 100건 상한)이다.
 * 🔄 **`spec 084`**: 카드 상자 제거 · 숫자는 **상자 없는 한 줄**(인증 · 미인증 · 최근 순찰) · 🆕 최근 순찰에 **순찰자 · 코스 · 시각**
 * (받은 기록 중 가장 최근에 인증한 줄에서 — 요청이 늘지 않는다) · 14일 막대는 차트 카드 말풍선 · 세로 눈금 숫자 없음.
 *
 * - 🔴 **막대를 누르면 그날만** 보인다 — 한 번 더 누르거나 `전체 보기` 로 풀린다.
 * - 🔄 **행 상태는 순찰이력 화면과 같은 뱃지**(`pointCheckBadge` — 이상없음 · 순찰기록 · 미완료 ·
 *   미인증 · 순찰제외 · 진행중 · 대기중, 사용자 결정 2026-11-13). 시안의 `인증/누락` 을 쓰면 같은
 *   기록이 지점 인증 상세에서는 `미완료` 로 보여 화면마다 이름이 달랐다. (시각 칸은 미인증 줄에도 적는다 — 아래 timeOf.)
 * - 🔴 **행 → 지점 인증 상세**(D1). 시안의 회차 상세 모달은 `historySeq` 가 없어 못 연다(037 US4).
 * - 코스명은 행마다 옅게 둔다 — 소속 코스가 여러 개일 수 있다(시안은 "반복 제거" 라 했지만
 *   코스가 둘 이상이면 어느 코스 순찰인지 사라진다).
 */

const STATUS = { EXCLUDED: 2, MISSED: 3, DONE: 4 } as const

/**
 * 줄의 시각. 🔄 `spec 084`(사용자 지적 2026-11-21): **미인증 줄에도 적는다** — 전에는 "미인증 줄의 `checkDt` 가 인증 시각이 맞는지
 * 모른다"(OQ-15)며 `—` 로 가렸는데, 그 의문은 2026-10-19 DB 확인으로 풀렸다(지점에 들른 시각이다). 순찰이력 목록도 이미 적는다.
 */
const timeOf = (row: PointHistoryRow): string => {
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
    <AppChartTooltip
      title={format(parseISO(date), 'yyyy.MM.dd')}
      rows={[
        { label: '인증', value: `${count}회` },
        { label: '미인증', value: `${missed}회`, color: 'var(--muted-foreground)' },
      ]}
    />
  )
}

/** 상자 없는 한 줄 숫자의 한 칸 — `이름 **값** 덧말`. 칸 사이는 세로 선 */
const Stat = ({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) => (
  <div className="flex items-baseline gap-1.5 border-l border-border pr-1 pl-4 text-[12px] text-muted-foreground first:border-l-0 first:pl-0">
    {label}
    <span className="text-[18px] font-semibold text-foreground tabular-nums">{value}</span>
    {note && <span className="tabular-nums">{note}</span>}
  </div>
)

/** 받은 기록 중 가장 최근에 **인증한** 줄 — 최근 순찰 칸의 순찰자 · 코스 · 시각 */
const latestDone = (rows: PointHistoryRow[]): PointHistoryRow | null => {
  const done = rows.filter((row) => row.status === STATUS.DONE)
  return done.length > 0 ? done.reduce((a, b) => (b.checkDt > a.checkDt ? b : a)) : null
}

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
  const latest = latestDone(rows)
  const todayKey = format(today, 'yyyy-MM-dd')

  return (
    <section className="flex min-w-0 flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="flex items-baseline gap-2">
          <h2 className="text-panel-title font-semibold text-foreground">인증 기록</h2>
          <span className="text-caption text-muted-foreground">최근 14일 · 막대를 누르면 해당 일자만 표시</span>
        </span>
        <Link
          to={paths.service.patrolPoints}
          className="inline-flex shrink-0 items-center gap-0.5 text-caption font-medium text-point hover:underline"
        >
          지점 순찰이력 전체
          <ChevronRightIcon size={13} aria-hidden />
        </Link>
      </div>

      {isPending ? (
        <div className="h-[220px] animate-pulse rounded-sm bg-muted" />
      ) : summary.attempted === 0 ? (
        /* 🔴 기능은 있고 데이터가 없는 것 — placeholder 가 아니다. 한 영역 안이라 글자 한 줄(`spec 084`) */
        <p className="py-6 text-center text-caption text-muted-foreground">순찰 기록이 없습니다</p>
      ) : (
        <>
          {/* 🔴 인증률에 색을 입히지 않는다 — 분모를 확신할 수 없다(`spec 023`) */}
          <div className="flex flex-wrap gap-y-2">
            <Stat
              label="인증"
              value={summary.total}
              note={`/ ${summary.attempted}회${rate !== null ? ` · ${rate}%` : ''}`}
            />
            <Stat label="미인증" value={summary.missed} note="회" />
            <Stat
              label="최근 순찰"
              /* 지점의 마지막 순찰 시각이 없으면(또는 읽을 수 없으면) 받은 기록의 가장 최근 인증으로 센다 */
              value={sinceLabel ?? (latest && formatSinceLabel(latest.checkDt, today)) ?? '-'}
              /* 🔄 사용자 결정 2026-11-21 — 목업대로 **순찰자 이름만**. 코스 · 일시는 바로 아래 목록 첫 줄에 있다 */
              note={latest && (latest.userName || '근무자 없음')}
            />
          </div>

          {/* 🔴 막대를 누르면 recharts 가 차트 전체에 포커스 테두리를 그린다 — 막대 색 변화로 충분해 지운다 */}
          <div className="h-[100px] w-full [&_*:focus]:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.buckets} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={4}>
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
                {/* 🔴 쌓기 — 인증(파랑) 위에 미인증(회색). 🔄 `spec 084`(목업 대조): 칸을 채우는 넓은 막대 · 옅게 깔고
                    **고른 날만 진하게**(고르지 않았으면 오늘) */}
                <Bar
                  dataKey="count"
                  stackId="day"
                  radius={2}
                  className="cursor-pointer"
                  onClick={(data: { payload?: PatrolDayBucket }) => data.payload && toggle(data.payload.date)}
                  isAnimationActive={false}
                >
                  {summary.buckets.map((bucket) => (
                    <Cell
                      key={bucket.date}
                      fill="var(--point)"
                      fillOpacity={bucket.date === (selected ?? todayKey) ? 1 : 0.35}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="missed"
                  stackId="day"
                  radius={2}
                  className="cursor-pointer"
                  onClick={(data: { payload?: PatrolDayBucket }) => data.payload && toggle(data.payload.date)}
                  isAnimationActive={false}
                >
                  {summary.buckets.map((bucket) => (
                    <Cell
                      key={bucket.date}
                      fill="var(--muted-foreground)"
                      fillOpacity={bucket.date === (selected ?? todayKey) ? 0.6 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 범례는 없앴다 — 말풍선이 인증 · 미인증을 적는다. 고른 날이 있을 때만 푸는 줄을 보인다 */}
          {selected && (
            <p className="text-caption text-muted-foreground">
              {dayLabel(selected)}만 표시 ·{' '}
              <button type="button" className="font-medium text-point hover:underline" onClick={() => setSelected(null)}>
                전체 보기
              </button>
            </p>
          )}

          {groups.length === 0 ? (
            <p className="py-6 text-center text-body text-muted-foreground">이 날은 기록이 없습니다.</p>
          ) : (
            <div className="flex flex-col">
              {groups.map((group) => (
                <section key={group.date} aria-label={`${dayLabel(group.date)} 기록`} className="mt-3.5 first:mt-0">
                  <div className="flex h-[30px] items-center gap-1.5 border-b border-border text-caption text-muted-foreground">
                    <span className="tabular-nums">
                      {group.date === todayKey && '오늘 · '}
                      {format(parseISO(group.date), 'M월 d일')} {weekday(group.date)} · {group.rows.length}회
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {group.rows.map((row) => {
                      const badge = pointCheckBadge(row.status, row.hasMemo)
                      return (
                        <li key={row.detailSeq} className="border-b border-border">
                          <Link
                            to={paths.service.patrolPointDetail(row.detailSeq)}
                            className="flex h-[46px] items-center hover:bg-muted/50"
                          >
                            <span className="w-20 shrink-0 font-medium tabular-nums text-foreground">{timeOf(row)}</span>
                            <span className="w-[120px] shrink-0 truncate pr-3 text-sub-foreground">
                              {row.userName || '근무자 없음'}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sub-foreground">{row.courseName}</span>
                            {/* 🔄 `spec 084`(사용자 지적 2026-11-21 — 목업대로): 정상 인증 줄에도 **초록 체크 + `인증`** 을 적는다.
                                (2026-11-13 에는 "같은 뱃지가 줄마다 반복된다"며 체크만 남겼었다.) 상태 이름은 순찰이력 화면과 같은 함수다 */}
                            <AppBadge variant={badge.variant} className={cn('shrink-0', cardBadge)}>
                              {badge.label}
                            </AppBadge>
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
