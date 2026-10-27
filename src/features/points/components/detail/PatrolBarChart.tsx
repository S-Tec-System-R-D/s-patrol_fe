import { format, parseISO } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { PatrolDayBucket } from '../../lib/patrolSummary'

/**
 * 일자별 순찰 인증 **추세** 차트 (`spec 027` → **`spec 031` 에서 막대 → 라인**).
 *
 * 🔴 **형태 판단이 뒤집혔다**(사용자 결정 2026-10-14). 027 은 "순찰은 그날 있었거나
 * 없었거나라 막대" 라고 적었고 그 자체로 맞는 말이었다. 바뀐 것은 **역할 분담**이다 —
 * `spec 031` 에서 KPI 의 **14일 점등 바**가 "그날 했나" 를 맡게 되면서, 같은 데이터를
 * 한 화면에 두 번 그리게 됐다. 그래서 여기는 **추세**만 맡는다: 점을 이어 **늘고 주는
 * 흐름**을 보여주고, 날짜별 사실 확인은 위 KPI 가 한다.
 * ⚠️ 라인은 "연속적으로 변한다" 고 말하는 형태라 **점을 반드시 찍는다**(`dot`) — 선만
 * 있으면 측정 지점이 어디인지 사라진다.
 *
 * 🔴 **직접 그린 div 막대를 걷어낸 이유**: 축이 없어 **막대만 보고는 아무것도 알 수
 * 없었다**(사용자 지적 2026-10-10) — 어느 날인지, 몇 회인지. 축·눈금·툴팁은 직접
 * 만들면 금방 어설퍼지는 종류라 `recharts` 를 쓴다(사용자 결정).
 *
 * **색** — 단일 계열이라 범주 팔레트가 필요 없다. 브랜드 강조색(`--point`) 하나를 쓰고
 * **범례를 두지 않는다**(계열이 하나면 제목이 곧 범례다). 팔레트 검증 통과:
 * 밝기 밴드·채도 하한·표면 대비 3:1 모두 PASS.
 * 🔴 **CSS 변수로 칠한다** — 하드코딩하면 다크 모드에서 따라오지 않는다.
 *
 * **축** — 🔴 **모든 날짜를 라벨링한다**(사용자 결정 2026-10-10). 30일일 때는 다 못 붙여
 * 5개만 띄엄띄엄 찍었는데, 그러면 **어느 막대가 어느 날인지 읽을 수 없다** — 축이 있으나
 * 마나였다. 기간을 **2주로 줄여**(`SUMMARY_DAYS`) 14개를 전부 찍는다.
 * 🔴 **라벨은 일(日)만, 월은 첫 칸 · 월이 바뀌는 칸 아래 둘째 줄에**(`spec 053` T969) —
 * 14개를 전부 `MM.dd` 로 찍으면 좁은 폭(320px 에서 칸당 약 15px)에서 라벨이 붙어
 * `10.1410.15…` 처럼 이어진 숫자로 읽혔다. 월을 같은 줄에 붙이면(`10.07`) 그 칸만 넓어
 * 옆 칸과 다시 붙어서 둘째 줄로 내렸다. 전체 날짜는 툴팁이 맡는다.
 * y축은 정수 눈금만, 축선 없이 **뒤로 물린다**(grid·axes는 recessive).
 */

export interface PatrolBarChartProps {
  buckets: PatrolDayBucket[]
}

/** x축 눈금 — 첫 줄 'dd', 첫 칸 · 월이 바뀌는 칸만 둘째 줄 'M월' */
const DateTick = ({
  x,
  y,
  payload,
  buckets,
}: {
  x?: number
  y?: number
  payload?: { value: string; index: number }
  buckets: PatrolDayBucket[]
}) => {
  if (!payload) return null
  const date = parseISO(payload.value)
  const prev = buckets[payload.index - 1]
  const monthChanged = !prev || prev.date.slice(0, 7) !== payload.value.slice(0, 7)

  return (
    <text x={x} y={y} textAnchor="middle" fontSize={10} fill="var(--color-muted-foreground)">
      <tspan x={x} dy="0.71em">
        {format(date, 'dd')}
      </tspan>
      {monthChanged && (
        <tspan x={x} dy="1.3em">
          {format(date, 'M월')}
        </tspan>
      )}
    </text>
  )
}

const ChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: PatrolDayBucket }[]
}) => {
  if (!active || !payload?.length) return null
  const { date, count } = payload[0].payload

  return (
    <div className="rounded-sm border border-border bg-card px-2.5 py-1.5 shadow-sm">
      <p className="text-caption text-muted-foreground">{format(parseISO(date), 'yyyy.MM.dd')}</p>
      {/* 🔴 숫자는 계열 색이 아니라 본문 잉크로 — 색은 막대가 들고 있다 */}
      <p className="text-body font-semibold text-foreground">{count}회</p>
    </div>
  )
}

const PatrolBarChart = ({ buckets }: PatrolBarChartProps) => {
  return (
    <div className="h-[152px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          {/* 가로선만, 점선, 뒤로 물린다 */}
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            // 🔴 전부 찍는다 — recharts 가 자동으로 솎아내지 않게 명시한다
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={<DateTick buckets={buckets} />}
            tickMargin={8}
            // 둘째 줄(월)만큼 축 높이를 늘린다 — 그만큼 차트 높이도 140 → 152
            height={42}
          />
          <YAxis
            // 횟수는 정수다 — 0.5회 눈금이 생기면 안 된다
            allowDecimals={false}
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
          />
          <Tooltip
            content={<ChartTooltip />}
            // 🔴 라인은 점이 얇다 — 세로선 커서로 **가까운 날**을 집게 한다
            cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-point)"
            strokeWidth={2}
            // 🔴 **점을 찍는다** — 선만 있으면 어디가 측정값인지 알 수 없다
            dot={{ r: 2.5, fill: 'var(--color-point)', strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            // 값이 없는 날은 0 이므로 선이 끊기지 않는다(버킷이 0 을 채운다)
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PatrolBarChart
