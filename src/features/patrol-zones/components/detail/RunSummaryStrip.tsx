import { formatElapsed } from '@/features/course-history/lib/elapsed'
import type { CourseHistoryDetail } from '@/features/course-history/types'

/**
 * 회차 상세 **요약 4칸** (`spec 077` 시안) — 시작 · 종료 · 소요 · 특이사항.
 *
 * 🔄 036 의 오른쪽 `순찰 정보` 카드(9행)를 대신한다. 코스명 · 순찰자는 머리, 지점 인증 수는 타임라인
 * 머리, 교대는 머리 부제 + 교대 이력 카드가 말한다. **평균 소요 · 인증수단 집계는 뺐다**(시안).
 * 🔴 `기준` 은 `totalMin` — 검증되지 않은 값이라(B-31) **판정하지 않고** 나란히 적기만 한다(036).
 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const dateLabel = (value: string): string => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return `${value.slice(5, 7)}.${value.slice(8, 10)} (${WEEKDAYS[date.getDay()]})`
}

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-1 px-4 py-3 xl:px-5 xl:py-4">
    <span className="text-caption text-muted-foreground">{label}</span>
    {/* 🔴 `xl` 미만은 **줄바꿈** — 한 줄에 시각 + 날짜(기준)를 우겨 넣으면 좁은 칸에서 잘렸다(사용자 지적 2026-11-13) */}
    <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-lg font-bold tabular-nums xl:flex-nowrap xl:text-xl">
      {children}
    </span>
  </div>
)

interface RunSummaryStripProps {
  detail: CourseHistoryDetail
  /** 메모가 있는 지점 수 — 인증 내역을 받기 전이면 `null`(없다고 단정하지 않는다) */
  memoRows: number | null
}

/* 🔴 **특이사항은 글자만**(사용자 결정 2026-11-13) — 누르는 동작을 뺐다. 기록은 타임라인에서 바로 보인다 */
const RunSummaryStrip = ({ detail, memoRows }: RunSummaryStripProps) => (
  <section
    aria-label="순찰 요약"
    /* `xl` 미만 2×2(가운데 세로선 · 첫 줄 아래 가로선) · `xl` 이상 한 줄 4칸 */
    className="grid grid-cols-2 rounded-lg border border-border bg-card xl:grid-cols-4 [&>*]:border-border [&>*:nth-child(-n+2)]:border-b xl:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(odd)]:border-r xl:[&>*:nth-child(2)]:border-r"
  >
    <Cell label="시작">
      {detail.startDt.slice(11, 16)}
      <span className="text-caption font-medium text-muted-foreground">{dateLabel(detail.startDt)}</span>
    </Cell>
    <Cell label="종료">
      {detail.endDt === null ? (
        <span className="text-point">진행중</span>
      ) : (
        <>
          {detail.endDt.slice(11, 16)}
          {detail.endDt.slice(0, 10) !== detail.startDt.slice(0, 10) && (
            <span className="text-caption font-medium text-muted-foreground">{dateLabel(detail.endDt)}</span>
          )}
        </>
      )}
    </Cell>
    <Cell label="소요시간">
      {formatElapsed(detail.elapsedTime)}
      <span className="text-caption font-medium text-muted-foreground">
        {detail.totalMin > 0 ? `기준 ${detail.totalMin}분` : '기준 미설정'}
      </span>
    </Cell>
    <Cell label="특이사항">
      {memoRows === null ? (
        <span className="text-muted-foreground">-</span>
      ) : memoRows === 0 ? (
        '없음'
      ) : (
        <span className="text-warning-foreground">{memoRows}건</span>
      )}
    </Cell>
  </section>
)

export default RunSummaryStrip
