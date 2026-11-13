import type { CourseDetailPoint } from '../types'

/**
 * 🔴🔴 **자리표시 값이다 — 실데이터가 아니다**(`spec 074` OQ-074-A · 사용자 결정 2026-11-12).
 *
 * 지점별 인증률(`11/28회`)은 회차 목록에 없다. 받으려면 지점 수만큼 `GetPointHistory` 를 부르거나 서버 집계가
 * 필요한데, 방법이 정해지지 않아 **화면만 먼저 그린다.** 값은 지점 순번으로 만든 고정값이라 실제와 맞지 않는다.
 * 연동할 때 이 파일을 실제 계산으로 바꾸고, 호출부(`CourseRouteCard`)는 그대로 둔다.
 */

export interface PointRate {
  checked: number
  total: number
}

const PLACEHOLDER_RATIOS = [0.39, 0.29, 0.11, 0.43, 0.27, 0.35, 0.18, 0.31]

export const placeholderPointRates = (points: CourseDetailPoint[], runs: number): Map<number, PointRate> => {
  const rates = new Map<number, PointRate>()
  points.forEach((point, index) => {
    const ratio = PLACEHOLDER_RATIOS[index % PLACEHOLDER_RATIOS.length]
    rates.set(point.coursePointSeq, { checked: Math.round(runs * ratio), total: runs })
  })
  return rates
}
