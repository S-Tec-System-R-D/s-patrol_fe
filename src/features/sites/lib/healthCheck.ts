import type { SiteDetail, UpdateExceptionTime } from '../types/site'

/**
 * 헬스체크 순수 함수 (`spec 044` T782).
 */

/**
 * 켜는 데 필요한 값이 비었는가 — 서버는 `healthCheckYn: true` 일 때 저장된 값까지 합쳐 5개를 검사한다(실측).
 * 비었으면 토글만으로는 켤 수 없어 **설정 모달을 연다**. 최소 생성 사업장은 `Interval 0 · Timeout 0 · null 3개`다.
 */
export const isHealthCheckEmpty = (detail: SiteDetail): boolean =>
  detail.healthCheckInterval <= 0 ||
  detail.healthCheckTimeout <= 0 ||
  detail.healthCheckRetry === null ||
  detail.healthCheckStartTime === null ||
  detail.healthCheckEndTime === null

const HH_MM = /^(\d{2}):(\d{2})/

/**
 * `'HH:mm:ss'` → `'HH:mm'`(초 버림). `null` · 읽을 수 없는 값은 `''`.
 * 🔴 서버가 24시간 이상을 일 단위(`'25.00:00:00'`)로 저장한 값도 여기서 걸러진다(B-53).
 */
export const toHHmm = (time: string | null): string => {
  const match = time === null ? null : HH_MM.exec(time)
  return match ? `${match[1]}:${match[2]}` : ''
}

const DAY_MINUTES = 24 * 60

/** `'HH:mm:ss'` → 자정부터 분. 읽을 수 없으면 `null` */
const toMinutes = (time: string | null): number | null => {
  const match = time === null ? null : HH_MM.exec(time)
  if (!match) return null
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return minutes <= DAY_MINUTES ? minutes : null
}

/** 하루 막대의 한 구간 — 0~1 비율 */
export interface DaySegment {
  from: number
  to: number
}

/**
 * 시작 · 종료 → 하루 막대 구간(`spec 080` 헬스체크 24시간 막대).
 * 🔴 **자정을 넘기면 두 구간**이다(22:00–06:00 → 22~24 · 0~6) — 폼이 자정 넘김을 허용한다.
 * 시작 = 종료 · 읽을 수 없는 값이면 빈 배열(그리지 않는다).
 */
export const daySegments = (start: string | null, end: string | null): DaySegment[] => {
  const from = toMinutes(start)
  const to = toMinutes(end)
  if (from === null || to === null || from === to) return []
  const ratio = (minutes: number) => minutes / DAY_MINUTES
  return from < to
    ? [{ from: ratio(from), to: ratio(to) }]
    : [
        { from: ratio(from), to: 1 },
        { from: 0, to: ratio(to) },
      ].filter((segment) => segment.to > segment.from)
}

/** `<input type="time">` 값(`'HH:mm'`) → 서버 `'HH:mm:ss'` */
export const toHHmmss = (time: string): string => `${time}:00`

/** 폼의 예외 시간 1행 — 새 행은 `detailSeq` 가 없다 */
export interface ExceptionTimeRow {
  detailSeq?: number
  start: string
  end: string
}

/**
 * 폼 행 → `UpdateSite.exceptionTime`.
 * 🔴 서버는 **보낸 목록으로 통째로 교체**한다 — 기존 행은 자기 `detailSeq` 로(빠지면 지워진다), 새 행은 `0`.
 */
export const toExceptionRequest = (rows: ExceptionTimeRow[]): UpdateExceptionTime[] =>
  rows.map((row) => ({
    detailSeq: row.detailSeq ?? 0,
    exceptionStartTime: toHHmmss(row.start),
    exceptionEndTime: toHHmmss(row.end),
  }))
