import type { CheckDetailRow } from '../types'

/**
 * 행별 **직전 인증과의 간격**(초) — 인증 내역 표의 `구간` 칸 (`spec 036` T513).
 *
 * 🔴 **`checkDt` 순으로 정렬한다.** 표는 `orderNo`
 * 순으로 그리지만 간격은 **실제로 찍힌 순서**의 차이다(편성 순서로 빼면 음수가 나온다).
 * 🔴 **첫 인증과 시각 없는 행은 `null`** — `0` 을 돌려주면 "0분 만에 도착" 과 섞인다.
 */
export const checkGaps = (rows: CheckDetailRow[]): Map<number, number | null> => {
  const ordered = rows
    .filter((row): row is CheckDetailRow & { checkDt: string } => row.checkDt !== null)
    .map((row) => ({ row, at: new Date(row.checkDt).getTime() }))
    .filter((entry) => Number.isFinite(entry.at))
    .sort((a, b) => a.at - b.at)

  const gaps = new Map<number, number | null>(rows.map((row) => [row.detailSeq, null]))
  ordered.forEach((entry, index) => {
    if (index === 0) return
    gaps.set(entry.row.detailSeq, Math.round((entry.at - ordered[index - 1].at) / 1000))
  })
  return gaps
}
