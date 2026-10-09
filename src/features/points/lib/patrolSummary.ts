import { differenceInCalendarDays, format, isValid, parseISO, subDays } from 'date-fns'

import type { PointHistoryRow } from '../types'

/**
 * 지점 순찰 인증 기록 집계 (`spec 027` Phase 3).
 *
 * 🔴 **전용 집계 API 가 없다.** swagger 44종에 "지점별 N일 인증 횟수" 같은 엔드포인트가
 * 없어 `GetPointHistory` 목록을 받아 **클라이언트에서 센다**. 그래서 집계 기간이 길어지면
 * 페이지를 다 받아야 한다 — 기본 30일은 한 페이지로 충분하다고 보고 `pageSize` 를 크게
 * 잡는다(호출부 책임). 기간이 길어지면 **서버 집계를 요청**하는 것이 맞다.
 *
 * 순수함수로 분리한 이유: 날짜 버킷·경계(0건·하루 다건·기간 밖)는 화면 없이 고정할 수
 * 있고, 렌더와 섞으면 그 경계를 테스트하기 어렵다.
 */

/** 집계 기본 기간(일). 목업의 "최근 30일" */
export const SUMMARY_DAYS = 30

export interface PatrolDayBucket {
  /** 'yyyy-MM-dd' */
  date: string
  count: number
}

export interface PatrolSummary {
  /** 기간 내 총 인증 횟수 */
  total: number
  /** 오래된 날 → 최근 날 순. **기록이 없는 날도 `count: 0` 으로 포함**한다 */
  buckets: PatrolDayBucket[]
}

/** 집계 기간의 시작일(포함). 서버 `fromDt` 로 그대로 쓴다 */
export const summaryFromDate = (today: Date, days = SUMMARY_DAYS): string =>
  format(subDays(today, days - 1), 'yyyy-MM-dd')

/** 집계 기간의 종료일(포함). 서버 `toDt` */
export const summaryToDate = (today: Date): string => format(today, 'yyyy-MM-dd')

/**
 * 이력 목록 → 날짜별 버킷 + 총계.
 *
 * - **기록이 없는 날도 버킷에 남긴다** — 빼면 막대 간격이 들쭉날쭉해 "쉰 날" 이 안 보인다.
 * - 🔴 **기간 밖·깨진 날짜는 버린다.** 서버가 범위를 지켜 주더라도 클라이언트가 그것을
 *   전제하지 않는다(손상된 값 하나가 총계를 틀리게 만든다).
 */
export const summarizePatrolHistory = (
  rows: PointHistoryRow[],
  today: Date,
  days = SUMMARY_DAYS
): PatrolSummary => {
  const counts = new Map<string, number>()
  for (let i = 0; i < days; i += 1) {
    counts.set(format(subDays(today, days - 1 - i), 'yyyy-MM-dd'), 0)
  }

  let total = 0
  for (const row of rows) {
    const parsed = parseISO(row.checkDt)
    if (!isValid(parsed)) continue

    // 기간 밖이면 버린다. 0 = 오늘, days-1 = 시작일
    const ago = differenceInCalendarDays(today, parsed)
    if (ago < 0 || ago > days - 1) continue

    const key = format(parsed, 'yyyy-MM-dd')
    counts.set(key, (counts.get(key) ?? 0) + 1)
    total += 1
  }

  return {
    total,
    buckets: [...counts.entries()].map(([date, count]) => ({ date, count })),
  }
}
