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

/**
 * 집계 기본 기간(일) — **2주**.
 *
 * 🔴 목업은 "최근 30일" 이었지만 **14일로 줄였다**(사용자 결정 2026-10-10). 30개 막대에는
 * 날짜를 다 못 붙여 띄엄띄엄 찍히고, 그러면 **어느 막대가 어느 날인지 읽을 수 없다**.
 * 14개면 모든 날짜를 라벨링할 수 있어 차트가 **읽히는** 물건이 된다.
 */
export const SUMMARY_DAYS = 14

export interface PatrolDayBucket {
  /** 'yyyy-MM-dd' */
  date: string
  count: number
}

export interface PatrolSummary {
  /**
   * 기간 내 **인증(완료) 횟수** — `status === 4` 인 행만 센다.
   *
   * 🔴🔴 **2026-10-14 전까지 미완료까지 세고 있었다.** `GetPointHistory` 는 필터 없이
   * 부르면 **미완료(3)와 완료(4)가 섞여서** 오고(실측: 사업장 69건 중 미완료 43건),
   * 🔴 **미완료 행도 `checkDt` 를 갖는다** — "날짜가 없어서 자연히 빠질 것" 이라는 가정이
   * 틀렸다. 그래서 "2주 인증 N회" 가 **실제 인증보다 부풀려져** 있었다.
   */
  total: number
  /**
   * 기간 내 **대상 순찰 횟수** — 완료 + 미완료. `total` 의 **분모**다.
   *
   * 이 값이 있어야 "7회" 가 **잘한 것인지** 알 수 있다 — 9회 중 7회와 7회 중 7회는
   * 다른 사실이다(`spec 031` 목업의 `인증 7 / 대상 순찰 9회`).
   */
  attempted: number
  /** 오래된 날 → 최근 날 순. **기록이 없는 날도 `count: 0` 으로 포함**한다 */
  buckets: PatrolDayBucket[]
}

/** 🔴 지점이력 `status` 사전에서 **완료**(코스이력은 1·2로 체계가 다르다 — B-7) */
const STATUS_DONE = 4

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
  let attempted = 0
  for (const row of rows) {
    const parsed = parseISO(row.checkDt)
    if (!isValid(parsed)) continue

    // 기간 밖이면 버린다. 0 = 오늘, days-1 = 시작일
    const ago = differenceInCalendarDays(today, parsed)
    if (ago < 0 || ago > days - 1) continue

    // 🔴 **미완료도 "대상" 에는 든다** — 돌기로 돼 있었는데 못 한 것이다
    attempted += 1
    if (row.status !== STATUS_DONE) continue

    const key = format(parsed, 'yyyy-MM-dd')
    counts.set(key, (counts.get(key) ?? 0) + 1)
    total += 1
  }

  return {
    total,
    attempted,
    buckets: [...counts.entries()].map(([date, count]) => ({ date, count })),
  }
}

/**
 * 버킷 → **날짜별 점등 배열** (`spec 031`). 오래된 날 → 최근 날 순.
 *
 * 🔴 **안 한 날도 칸을 남긴다**(`false`). 빼면 칸 수가 들쭉날쭉해 **"쉰 날" 이 보이지
 * 않는다** — 그게 이 바가 존재하는 이유다.
 */
export const toPatrolTicks = (summary: PatrolSummary): boolean[] =>
  summary.buckets.map((bucket) => bucket.count > 0)

/**
 * 마지막 인증으로부터 **얼마나 지났는지** — `9시간 전` · `3일 전` · `방금`.
 *
 * 🔴 **"얼마 전" 은 시각보다 먼저 읽힌다.** `10.14 10:14` 만 있으면 오늘인지 지난주인지
 * 머릿속으로 빼야 한다 — 관리자가 보는 건 **"최근인가"** 다.
 *
 * ⚠️ **미래 시각은 `null`** 이다. 서버 시계가 앞서 있으면 `-2시간 전` 같은 말이 나오는데,
 * 그건 사실이 아니라 **데이터 이상**이다 — 아무 말도 하지 않는 편이 낫다(A1).
 */
export const formatSinceLabel = (lastDt: string | null, now: Date): string | null => {
  if (!lastDt) return null
  const parsed = parseISO(lastDt)
  if (!isValid(parsed)) return null

  const minutes = Math.floor((now.getTime() - parsed.getTime()) / 60_000)
  if (minutes < 0) return null
  if (minutes < 60) return '방금'

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  return `${Math.floor(hours / 24)}일 전`
}
