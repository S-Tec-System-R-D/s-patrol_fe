/**
 * 차트 말풍선 카드 — `spec 084`(차트 공용 조각. 두 번째로 쓰는 화면인 코스 상세에서 뽑았다).
 *
 * 윗줄 = **무엇의 값인가**(시간대 · 순찰 시작 일시 · 날짜), 아랫줄 = 색 네모 · 이름 · 값(단위 포함).
 * 🔴 **값에는 단위를 붙여 준다**(`44분` · `100% · 8/8` · `3회`) — 숫자만 있으면 무엇의 수인지 알 수 없다(사용자 지적 2026-11-19).
 * Recharts `Tooltip` 의 `content` 안에서도, 직접 그린 그림의 Radix 말풍선 안에서도 같은 카드를 쓴다.
 */

interface AppChartTooltipRow {
  label: string
  value: string
  /** 색 네모 — 기본은 포인트색 */
  color?: string
}

interface AppChartTooltipProps {
  title: string
  rows: AppChartTooltipRow[]
}

const AppChartTooltip = ({ title, rows }: AppChartTooltipProps) => (
  <div className="min-w-[120px] rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-[12px] leading-[1.4] whitespace-nowrap shadow-lg">
    <p className="mb-1 font-medium text-foreground tabular-nums">{title}</p>
    {rows.map((row) => (
      <p key={row.label} className="flex items-center gap-2 text-muted-foreground">
        <span aria-hidden className="size-2.5 shrink-0 rounded-xs" style={{ background: row.color ?? 'var(--point)' }} />
        {row.label}
        <span className="ml-auto pl-3 font-medium text-foreground tabular-nums">{row.value}</span>
      </p>
    ))}
  </div>
)

export default AppChartTooltip
