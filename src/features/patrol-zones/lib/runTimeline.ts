import { POINT_HISTORY_STATUS, type CheckDetailRow } from '@/features/course-history/types'

/**
 * 회차 상세 **수행 타임라인** 계산 (`spec 077` — 시안 `개선안/순찰이력`).
 *
 * 순수 함수로 둔 이유: 이동시간 · 건너뜀 · 다음 지점은 경계(시각 없는 행 · 첫 인증 · 진행 중)가
 * 많아 화면 없이 고정해야 한다.
 *
 * - 🔴 **순서는 `orderNo` 그대로**(036 T513) — 서버가 중복 · 결번을 주어도 배열 위치로 다시 매기지 않는다.
 * - 🔴 **이동시간은 서버 값이 아니다** — 인증 시각이 있는 행을 **시간순**으로 놓고 앞 행과의 차이다
 *   (`checkGaps` 와 같은 규칙). 첫 인증은 **순찰 시작**부터 잰다.
 * - 🔴 시각이 없는 지점을 건너뛴 이동이면 출발 순번을 함께 준다 → 화면 `9분 이동 (06→08)`.
 */

export interface RunStep {
  row: CheckDetailRow
  /** 직전 인증(첫 인증이면 순찰 시작)에서 이 지점까지 — 초. 이 행에 시각이 없으면 `null` */
  moveSeconds: number | null
  /**
   * 이동이 **바로 앞 순번이 아닌 곳**에서 왔을 때 그 출발 순번 — `0` 은 순찰 시작.
   * 바로 앞에서 왔으면 `null`(괄호를 적지 않는다)
   */
  movedFrom: number | null
  /** 진행 중 회차에서 마지막 인증 다음의 대기 지점 — `다음 지점` 뱃지 */
  isNext: boolean
  /** 진행 중 회차의 **가장 최근 인증** 행 — 아래에 `N분 경과 · 진행중` */
  isLatest: boolean
}

const WAITING = new Set<number>([POINT_HISTORY_STATUS.WAITING, POINT_HISTORY_STATUS.IN_PROGRESS])

const timeOf = (value: string | null): number | null => {
  if (value === null) return null
  const at = new Date(value).getTime()
  return Number.isFinite(at) ? at : null
}

export const runTimeline = (
  rows: CheckDetailRow[],
  startDt: string,
  inProgress: boolean
): RunStep[] => {
  // 정렬이 안정적이어야 같은 orderNo(서버 중복)가 응답 순서를 지킨다
  const ordered = [...rows].sort((a, b) => a.orderNo - b.orderNo)
  const indexOf = new Map(ordered.map((row, index) => [row.detailSeq, index]))

  const timed = ordered
    .map((row) => ({ row, at: timeOf(row.checkDt) }))
    .filter((entry): entry is { row: CheckDetailRow; at: number } => entry.at !== null)
    .sort((a, b) => a.at - b.at)

  const start = timeOf(startDt)
  const moves = new Map<number, { seconds: number | null; from: number | null }>()
  timed.forEach((entry, i) => {
    const prev = timed[i - 1]
    const prevAt = prev ? prev.at : start
    const seconds = prevAt === null ? null : Math.max(0, Math.round((entry.at - prevAt) / 1000))
    const here = indexOf.get(entry.row.detailSeq) ?? 0
    const prevIndex = prev ? (indexOf.get(prev.row.detailSeq) ?? -1) : -1
    // 바로 앞 순번(또는 시작 → 첫 순번)이면 괄호 없음
    const from = here - prevIndex === 1 ? null : prev ? prev.row.orderNo : 0
    moves.set(entry.row.detailSeq, { seconds, from })
  })

  const latest = inProgress ? timed.at(-1)?.row.detailSeq : undefined
  const lastTimedIndex = timed.reduce((max, entry) => Math.max(max, indexOf.get(entry.row.detailSeq) ?? -1), -1)
  const next = inProgress
    ? ordered.find((row, index) => index > lastTimedIndex && WAITING.has(row.status))?.detailSeq
    : undefined

  return ordered.map((row) => {
    const move = moves.get(row.detailSeq)
    return {
      row,
      moveSeconds: move?.seconds ?? null,
      movedFrom: move?.from ?? null,
      isNext: row.detailSeq === next,
      isLatest: row.detailSeq === latest,
    }
  })
}

/** 순번 두 자리 — `(06→08)` · 시작은 `시작` */
export const orderLabel = (order: number): string => (order === 0 ? '시작' : String(order).padStart(2, '0'))

/** 특이사항(메모가 있는) 행 수 — 요약 칸 `특이사항 n건` */
export const memoRowCount = (rows: CheckDetailRow[]): number => rows.filter((row) => row.memos.length > 0).length

/** 사진 수 — 메모마다 `attaches` 합. ⚠️ `attaches` 는 nullable */
export const photoCountOf = (row: CheckDetailRow): number =>
  row.memos.reduce((sum, memo) => sum + (memo.attaches?.length ?? 0), 0)
