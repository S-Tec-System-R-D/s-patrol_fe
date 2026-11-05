import type { CheckDetailRow, HandOverRow } from '../types'

/**
 * 교대 이력의 사람별 담당 구간 (`spec 070`).
 *
 * 🔴 **구간은 교대 위치(`lastOrderNo`)로 나눈다** — 이름으로 묶으면 A → B → A 에서 A 의 두 구간이 섞인다.
 * 🔴 **그 구간에서 실제 처리한 지점만 센다** — 받은 사람이 처리 없이 끝난 회차가 있다(회차 94). 처리 여부는
 * 지점 내역의 `userName` 이다(가지 않은 지점은 `null`).
 */

export interface HandOverSegment {
  name: string
  /** `1~4번 지점` · `5번 지점` · 처리가 없으면 `null` */
  range: string | null
  /** 다음 사람에게 넘긴 위치 — 마지막 사람과 위치를 모르는 교대는 `null` */
  handOverAfter: number | null
}

const rangeLabel = (orders: number[]): string | null => {
  if (orders.length === 0) return null
  const first = Math.min(...orders)
  const last = Math.max(...orders)
  return first === last ? `${first}번 지점` : `${first}~${last}번 지점`
}

export const handOverSegments = (rows: HandOverRow[], checks: CheckDetailRow[]): HandOverSegment[] => {
  const processed = checks.filter((check) => check.userName !== null).map((check) => check.orderNo)
  let from = 0

  const segments = rows.map((row) => {
    const until = row.lastOrderNo ?? from
    const orders = processed.filter((order) => order > from && order <= until)
    from = until
    return { name: row.fromUserName, range: rangeLabel(orders), handOverAfter: row.lastOrderNo }
  })

  const lastName = rows[rows.length - 1].toUserName
  const start = from
  return [
    ...segments,
    { name: lastName, range: rangeLabel(processed.filter((order) => order > start)), handOverAfter: null },
  ]
}
