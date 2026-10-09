import { format, parseISO } from 'date-fns'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { PatrolDayBucket } from '../../lib/patrolSummary'

/**
 * 일자별 순찰 인증 횟수 막대 차트 (`spec 027`, recharts 도입 2026-10-10).
 *
 * **형태 선택** — 데이터의 일은 *시간에 따른 변화*이고 값은 **하루 단위 이산 횟수**다.
 * 선 그래프는 점 사이를 이어 "연속적으로 변한다" 고 말하는데, 순찰은 **그날 있었거나
 * 없었거나**다. 그래서 막대다.
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
 * **축** — 30일을 다 라벨링하면 겹친다. **약 5개만** 찍고 나머지는 툴팁이 맡는다.
 * 🔴 **첫날과 마지막날(= 오늘)은 반드시 찍는다.** `interval` 에 맡겼더니 끝이 잘려
 * **가장 중요한 "오늘" 에 라벨이 없었다**(2026-10-10 캡쳐에서 발견) — 기간의 양 끝을
 * 모르면 "최근 30일" 이 어디부터 어디까지인지 알 수 없다.
 * y축은 정수 눈금만, 축선 없이 **뒤로 물린다**(grid·axes는 recessive).
 */

export interface PatrolBarChartProps {
  buckets: PatrolDayBucket[]
}

/** 'yyyy-MM-dd' → 'MM.dd' */
const tickLabel = (date: string) => format(parseISO(date), 'MM.dd')

/**
 * 라벨링할 날짜를 고른다 — **양 끝 포함**, 사이는 균등.
 * `interval` 은 끝을 보장하지 않아 직접 고른다.
 */
const pickTicks = (buckets: PatrolDayBucket[], count = 5): string[] => {
  if (buckets.length <= count) return buckets.map((b) => b.date)

  const step = (buckets.length - 1) / (count - 1)
  const picked = new Set<string>()
  for (let i = 0; i < count; i += 1) {
    picked.add(buckets[Math.round(i * step)].date)
  }
  return [...picked]
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
  const ticks = pickTicks(buckets)

  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          {/* 가로선만, 점선, 뒤로 물린다 */}
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tickFormatter={tickLabel}
            ticks={ticks}
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickMargin={8}
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
            // 막대보다 큰 히트 영역 — 얇은 막대를 정확히 겨냥하지 않아도 뜬다
            cursor={{ fill: 'var(--color-muted)', opacity: 0.5 }}
          />
          <Bar
            dataKey="count"
            fill="var(--color-point)"
            // 데이터 끝만 둥글게, 바닥은 기준선에 붙인다
            radius={[4, 4, 0, 0]}
            maxBarSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PatrolBarChart
