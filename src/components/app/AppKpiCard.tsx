import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * 상세 화면 상단의 **요약 칸(KPI)** — 코스 4칸 · 지점 3칸 · 배치 3칸 공용 (`spec 031`).
 *
 * 🔴 **031 에서 두 벌을 한 벌로 합쳤다.** 코스는 이 컴포넌트를, 지점은 `PointStats` 안의
 * 로컬 `Stat` 을 쓰고 있어 **같은 자리가 화면마다 다르게** 보였다.
 *
 * 🔴 **"유치해 보인다" 의 주범 세 가지를 고쳤다**(사용자 평가 2026-10-13):
 * ① 좌측 **원형** 컬러 아이콘 → **우상단 라운드 사각**, ② `size-10` → `size-8`,
 * ③ 칸마다 다른 4종 tone → **중립 기본**(색은 근거 있는 칸에만). 색이 칸마다 다르면
 * 네 칸이 서로 경쟁해서 **무엇이 중요한지** 가 사라진다.
 *
 * 🔴 **목업의 "바" 와 "증감 뱃지" 를 모든 칸에 넣지 않는다.** 칸별로 따져 보니 바를 그릴
 * 근거가 있는 곳은 **인증률 하나**고, 증감은 **0칸**이다(이전 구간 집계가 필요한데 서버
 * 요청이 는다 — OQ-031-A). 없는 기준값을 지어내는 것보다 **비워 두는 쪽**이 낫다(A1).
 *
 * ⚠️ **어휘의 기준점이다** — `spec 034`(목록 카드 시각 정합)가 여기 쓰인 토큰을 따라간다.
 * 새 토큰을 만들지 않았다(전부 `index.css` 에 있던 것).
 */

/**
 * 아이콘 칩의 톤.
 *
 * 🔴 **기본은 중립(회색)이고, 칩은 제목 줄 왼쪽에 붙는다**(사용자 결정 2026-10-14).
 * 색을 올려 보다가 되돌린 결정이다 — **색 대신 위치로 푼다**:
 * ① 우상단에 떨어져 있으면 제목 줄이 양끝으로 벌어져 **가운데가 빈다**("여백이 많다" 는
 * 지적의 실제 원인), ② 왼쪽에 붙이면 **아이콘 + 라벨이 한 덩어리**로 읽히고 눈은 바로
 * 큰 숫자로 간다. 색은 **바(완료/미완료 조각)** 가 이미 들고 있어 카드가 무채색이 되지 않는다.
 *
 * 🔴 **`warning`·`danger` 는 근거가 있는 칸에만**(미인증 지점 = 서버가 직접 센 건수).
 * `point` 는 남겨 두되 **기본이 아니다** — 칸마다 다른 색을 주면 네 칸이 경쟁한다.
 */
type AppKpiCardTone = 'neutral' | 'point' | 'warning' | 'danger'

const toneStyles: Record<AppKpiCardTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  point: 'bg-point-bg text-point',
  warning: 'bg-warning-bg text-warning-foreground',
  danger: 'bg-danger-bg text-danger-foreground',
}

/**
 * 분할 바 조각의 뜻.
 *
 * 🔴 **색을 쓰는 곳과 안 쓰는 곳을 가른다.** `done`/`fail` 은 **서버가 센 상태값**이라
 * 색을 입힐 근거가 있지만(완료/미완료는 사실이다), 비율 바(`ratio`)는 분모를 확신할 수
 * 없어 **중립**이다(`spec 023` — 지점 상태에 `순찰제외`가 있다).
 */
type SegmentTone = 'done' | 'progress' | 'fail' | 'neutral'

const segmentStyles: Record<SegmentTone, string> = {
  done: 'bg-success',
  progress: 'bg-point',
  fail: 'bg-danger',
  neutral: 'bg-muted-foreground/40',
}

/**
 * 값 아래 **바** — 네 가지뿐이고, **판별 유니온 하나**로 받는다.
 *
 * 🔴 **prop 을 넷으로 쪼개지 않는 이유**: `ratio`·`segments`·`range`·`ticks` 를 따로 두면
 * 계약이 7개로 늘고(`spec 030` 의 "prop 5개면 뽑지 않는다" 기준에 걸린다), **"범위 바인데
 * 조각을 줬다" 같은 조합이 타입에서 통과**한다. 유니온이면 그 조합이 **컴파일에서 막힌다**.
 */
export type AppKpiBar =
  /** 비율 하나(0~1) — 인증률·2주 인증. 🔴 채움은 **중립색** */
  | { kind: 'ratio'; value: number }
  /** 🔴 **구성**을 보여준다 — 조각의 합이 분모다(순찰 수행 완료/진행/미완료, 미인증 지점별) */
  | { kind: 'segments'; parts: { label: string; value: number; tone?: SegmentTone }[] }
  /** 최소~최대 안에서 **현재 위치** — 평균 소요시간(최단~최장) */
  | { kind: 'range'; min: number; max: number; value: number }
  /** 날짜별 점등 — 최근 순찰 14일. `true` 인 날만 채운다 */
  | { kind: 'ticks'; days: boolean[] }

interface AppKpiCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  unit?: string
  /**
   * 값 아래 **바**(`AppKpiBar`).
   *
   * 🔴 **주지 않으면 그리지 않는다.** 특히 비율을 만들 수 없는 상태(분모 0·이력 없음)에
   * `0%` 바를 그리면 **"0점" 으로 읽힌다** — 그건 **진짜 0%** 와 다른 사실이다.
   * 🔴 **`ratio` 채움은 중립색**이다 — 인증률에 색을 못 쓰는 이유(`순찰제외` 때문에
   * 분모를 확신할 수 없다, `spec 023`)가 바에도 적용된다. 반면 `segments` 의 완료/미완료는
   * **서버가 센 상태값**이라 색을 입힐 근거가 있다.
   */
  bar?: AppKpiBar | null
  /**
   * 바 **양끝 라벨** — 목업의 `완료 5` … `미완료 1`, `최단 42분` … `최장 58분`.
   * 🔴 **구성을 읽게 하는 장치다**: 바만 있으면 "무엇이 얼마인지" 를 알 수 없다.
   */
  foot?: { left: string; right?: string }
  /** 값 옆 작은 뱃지 — `78%`·`9시간 전`. 🔴 **사실만**(평가어 금지) */
  badge?: string
  /**
   * **라벨 우측**의 보조 문구 — "무엇을 센 값인지" 만 적는다(`최근 14일 기준`,
   * `전체 인증 13 / 21건`). 🔴 `양호`·`개선 필요` 같은 **평가어를 쓰지 않는다**.
   *
   * 🔴 **값 아래가 아니라 제목 줄이다**(사용자 결정 2026-10-20). 아래에 두면 **hint 를
   * 가진 칸만 한 줄 더 길어져** 나머지 칸의 바닥이 빈다 — 높이는 `h-full` 로 맞춰지므로
   * 그 여백이 "허전함" 으로 읽힌다. 제목 줄은 어차피 라벨 뒤가 비어 있던 자리다.
   *
   * ⚠️ **짧게 쓴다**(칸 폭이 1/3~1/4 다). 길면 잘리고 `title` 로만 남는다 — 두 값을
   * 나란히 보여줄 일이면 `hint` 가 아니라 `foot` 이다(`최단 … 최장` 과 같은 자리).
   */
  hint?: string
  /**
   * 🔴 **기본은 중립.** `warning`·`danger` 는 **근거가 있는 칸에만**
   * (미인증 = 서버가 직접 센 건수). 칸마다 색을 바꾸면 네 칸이 서로 경쟁한다.
   */
  tone?: AppKpiCardTone
  /**
   * 값이 숫자가 아닐 때(`10.13 09:07` 같은 시각) **한 단계 작게** 쓴다 —
   * 날짜가 숫자 자리에 들어가면 줄바꿈된다.
   */
  compactValue?: boolean
}

/** 0~1 로 자른다 — 범위 밖 값이 바를 넘치게 하지 않는다 */
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/**
 * 바 본체. 🔴 **네 종류가 같은 높이·라운딩**을 쓴다 — 칸마다 두께가 다르면 4칸이
 * 들쭉날쭉해 보인다.
 */
const KpiBar = ({ bar }: { bar: AppKpiBar }) => {
  if (bar.kind === 'ratio') {
    return (
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted" role="presentation">
        <div
          className="h-full rounded-full bg-muted-foreground/40"
          style={{ width: `${clamp01(bar.value) * 100}%` }}
        />
      </div>
    )
  }

  if (bar.kind === 'segments') {
    const total = bar.parts.reduce((sum, part) => sum + part.value, 0)
    // 🔴 합이 0 이면 그리지 않는다 — 빈 트랙만 남으면 "0점" 으로 읽힌다
    if (total <= 0) return null
    return (
      <div className="flex h-1 w-full gap-0.5 overflow-hidden rounded-full" role="presentation">
        {bar.parts
          .filter((part) => part.value > 0)
          .map((part) => (
            <div
              key={part.label}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', segmentStyles[part.tone ?? 'neutral'])}
              style={{ width: `${(part.value / total) * 100}%` }}
              title={`${part.label} ${part.value}`}
            />
          ))}
      </div>
    )
  }

  if (bar.kind === 'range') {
    const span = bar.max - bar.min
    // 🔴 최단 = 최장이면 위치가 의미 없다 — 가운데 둔다(0 으로 나누지도 않는다)
    const position = span <= 0 ? 0.5 : clamp01((bar.value - bar.min) / span)
    return (
      <div className="relative h-1 w-full rounded-full bg-muted" role="presentation">
        <span
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-card bg-muted-foreground"
          style={{ left: `${position * 100}%` }}
        />
      </div>
    )
  }

  // ticks — 날짜별 점등. 🔴 **안 한 날도 칸을 남긴다**(빼면 "쉰 날" 이 안 보인다)
  return (
    <div className="flex h-1 w-full gap-0.5" role="presentation">
      {bar.days.map((on, index) => (
        <span
          key={index}
          className={cn('h-full flex-1 rounded-full', on ? 'bg-success' : 'bg-muted')}
        />
      ))}
    </div>
  )
}

const AppKpiCard = ({
  icon: Icon,
  label,
  value,
  unit,
  bar,
  foot,
  badge,
  hint,
  tone = 'neutral',
  compactValue = false,
}: AppKpiCardProps) => {

  return (
    /* 🔴 **높이를 맞춘다**(`h-full`). 라벨이 2줄인 칸이 섞이면 4칸이 들쭉날쭉해지고,
       그 자체가 정돈되지 않은 인상을 준다 */
    <div className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {/* 🔴 **아이콘이 제목 줄 왼쪽에 붙는다**(사용자 결정 2026-10-14) — 우상단에 떨어져
          있으면 제목 줄 가운데가 비어 카드가 헐거워 보인다. 라운드 사각은 유지한다
          (원형 컬러 뱃지가 "유치해 보인다" 의 주범이었다) */}
      <div className="flex items-center gap-2">
        <span
          className={cn('grid size-8 shrink-0 place-items-center rounded-md', toneStyles[tone])}
        >
          <Icon size={15} strokeWidth={1.75} />
        </span>
        {/* 🔴 **라벨에는 색을 입히지 않는다**. 라벨이 색을 가지면 4칸이 다시 경쟁한다 —
            "무엇인지" 를 말하는 자리라 **굵기와 명도**로 세운다 */}
        <p className="min-w-0 shrink-0 text-caption font-medium text-foreground/80">{label}</p>
        {/* 🔴 **보조 문구는 라벨 뒤에 붙는다**(사용자 결정 2026-10-20 — 값 아래에서 올렸다).
            🔴 **라벨이 먼저 자리를 갖는다**(`shrink-0`) — 좁은 폭에서 둘이 같이 줄면
            **"무엇인지" 가 먼저 잘린다.** 보조 문구는 잘려도 `title` 에 남는다 */}
        {hint && (
          <span className="ml-auto truncate text-label text-muted-foreground/80" title={hint}>
            {hint}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold text-foreground tabular-nums',
              compactValue ? 'text-panel-title' : 'text-xl'
            )}
          >
            {value}
          </span>
          {unit && <span className="text-caption font-medium text-muted-foreground">{unit}</span>}
          {/* 🔴 뱃지는 **사실만** — `78%`·`9시간 전`. 평가어(`양호`)를 넣지 않는다.
              🔴 **강조색은 아이콘 칩이 가져갔다**(사용자 결정 2026-10-14). 뱃지까지 포인트색이면
              **한 카드에 같은 강조가 두 번**이라 서로를 깎아먹는다 — 대신 **잉크를 진하게**
              해서 회색으로 묻히지 않게 한다.
              ⚠️ **값에 따라 색을 바꾸지 않는다**: `78%` 가 좋은지 나쁜지를 화면이 **판정**하게
              되는데 그 기준이 없다(`순찰제외` 때문에 분모를 확신할 수 없다 — `spec 023`) */}
          {badge && (
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-label font-semibold text-foreground">
              {badge}
            </span>
          )}
        </p>

        {bar && <KpiBar bar={bar} />}

        {/* 바 양끝 라벨 — **바가 무엇의 구성인지**를 읽게 한다 */}
        {foot && (
          <div className="flex items-center justify-between gap-2 text-label text-muted-foreground/80">
            <span className="truncate">{foot.left}</span>
            {foot.right && <span className="shrink-0 truncate">{foot.right}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppKpiCard
