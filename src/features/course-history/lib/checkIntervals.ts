import type { CheckDetailRow } from '../types'

/**
 * 지점 간 구간 간격 (`spec 036` T499).
 *
 * 목업 `02` 의 KPI "구간 평균 간격 6.4분 / 최단 3분 / 최장 8분" 자리다. 서버가 주지 않아
 * `CheckDetails` 의 `checkDt` 차이로 계산한다 — **요청은 늘지 않는다**(인증 내역을 이미 받는다).
 *
 * 🔴 **`checkDt` 가 없는 행은 계산에서 뺀다.** 166행 전수 중 `status 0`·`1` 과 미완료
 * 79건이 `null` 이다 — `null` 을 0 으로 읽으면 간격이 음수·거대값이 된다.
 * 🔴 **뺀 건수를 함께 돌려준다** — 화면이 "N개 제외" 를 적을 수 있어야 한다. 조용히 빼면
 * 8개 지점 코스의 평균이 2개로 계산됐는데도 그냥 평균처럼 보인다.
 *
 * 🔴 **`orderNo` 로 정렬하지 않고 `checkDt` 로 정렬한다.** ① 서버가 `orderNo` **중복을
 * 저장한다**(`spec 032` 에서 확인 — 그래서 순번을 배열 위치로 셌다) ② 간격은 **실제로 찍힌
 * 순서**의 차이다. 편성 순서대로 돌지 않았다면 편성 순서로 뺀 간격은 음수가 된다.
 *
 * ⚠️ 음수 간격은 **버리지 않고 그대로 센다** — 같은 시각에 두 번 찍히거나 시계가 뒤로 간
 * 데이터가 있을 수 있고, 그걸 숨기면 "간격이 이상하다" 는 사실이 사라진다. 다만 최단값이
 * 음수로 나오면 화면이 그대로 보여 주므로 **실데이터에서 나오면 OQ 로 올린다**.
 */

export interface CheckIntervals {
  /** 평균 간격(초). 간격을 하나도 못 만들면 `null` */
  averageSeconds: number | null
  shortestSeconds: number | null
  longestSeconds: number | null
  /** 간격 개수 = 센 인증 수 - 1 */
  intervalCount: number
  /** 🔴 `checkDt` 가 없어 **제외된 행 수**. 화면이 명시한다 */
  skippedRows: number
}

const EMPTY: CheckIntervals = {
  averageSeconds: null,
  shortestSeconds: null,
  longestSeconds: null,
  intervalCount: 0,
  skippedRows: 0,
}

export const checkIntervals = (rows: CheckDetailRow[]): CheckIntervals => {
  const stamps = rows
    .map((row) => row.checkDt)
    .filter((value): value is string => value !== null)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)

  const skippedRows = rows.length - stamps.length
  if (stamps.length < 2) return { ...EMPTY, skippedRows }

  const gaps = stamps.slice(1).map((stamp, index) => Math.round((stamp - stamps[index]) / 1000))

  return {
    averageSeconds: Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length),
    shortestSeconds: Math.min(...gaps),
    longestSeconds: Math.max(...gaps),
    intervalCount: gaps.length,
    skippedRows,
  }
}
