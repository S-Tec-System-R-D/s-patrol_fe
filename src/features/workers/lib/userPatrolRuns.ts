import { format, parseISO, subDays } from 'date-fns'

import { COURSE_HISTORY_STATUS, type CourseHistoryRow } from '@/features/course-history/types'

/**
 * 근무자 상세의 **회차 기록** 계산 (`spec 079`). 모두 순수 함수다.
 *
 * 🔴 출처는 `GetCourseHistory` — `userName` 부분 일치로 받으므로 **`userList` 의 `userSeq` 로 다시 거른다**(D4).
 */

export const RUN_DAYS = 14

/** 이 근무자가 처리한 회차만 — 동명이인 · 이름 포함(`김민` → `김민준`)을 뺀다 */
export const filterMyRuns = (rows: CourseHistoryRow[], userSeq: number): CourseHistoryRow[] =>
  rows.filter((row) => row.userList.some((user) => user.userSeq === userSeq))

/**
 * 🔴 **미완료 포함** = 끝난 회차 중 인증하지 못한 지점이 있는 회차(D2). 진행 중은 아직 판단하지 않는다.
 * ⚠️ `status` 가 아니라 두 수로 본다 — `완료` 인데 `checkedCount: 0` 인 행이 실재한다(api-spec 15)
 */
export const isIncompleteRun = (row: CourseHistoryRow): boolean =>
  row.status !== COURSE_HISTORY_STATUS.IN_PROGRESS && row.checkedCount < row.pointCount

/** 교대 — 처리한 사람이 둘 이상. ⚠️ 교대받고 하나도 처리하지 않은 사람은 `userList` 에 없다(spec 제약 2) */
export const hasHandOver = (row: CourseHistoryRow): boolean => row.userList.length > 1

export interface RunSummary {
  runs: number
  points: number
  checked: number
  incomplete: number
  memo: number
  overtime: number
}

export const summarizeRuns = (rows: CourseHistoryRow[]): RunSummary => ({
  runs: rows.length,
  points: rows.reduce((sum, row) => sum + row.pointCount, 0),
  checked: rows.reduce((sum, row) => sum + row.checkedCount, 0),
  incomplete: rows.filter(isIncompleteRun).length,
  memo: rows.filter((row) => row.hasMemo).length,
  overtime: rows.filter((row) => row.overtimeYn).length,
})

/** 막대 색 하나 — 미완료 포함과 시간초과가 겹치면 **미완료 포함**(시안 범례) */
export type RunKind = 'normal' | 'overtime' | 'incomplete'

export const runKind = (row: CourseHistoryRow): RunKind =>
  isIncompleteRun(row) ? 'incomplete' : row.overtimeYn ? 'overtime' : 'normal'

export interface RunDayBucket {
  date: string // 'yyyy-MM-dd'
  normal: number
  overtime: number
  incomplete: number
}

const dayOf = (row: CourseHistoryRow) => row.startDt.slice(0, 10)

/** 오늘 포함 14일 — 기록 없는 날도 0 칸으로 둔다(막대 자리가 비어야 "안 했다" 가 보인다) */
export const runDayBuckets = (rows: CourseHistoryRow[], today: Date, days: number = RUN_DAYS): RunDayBucket[] =>
  Array.from({ length: days }, (_, i) => {
    const date = format(subDays(today, days - 1 - i), 'yyyy-MM-dd')
    const bucket: RunDayBucket = { date, normal: 0, overtime: 0, incomplete: 0 }
    rows.filter((row) => dayOf(row) === date).forEach((row) => (bucket[runKind(row)] += 1))
    return bucket
  })

export interface RunDayGroup {
  date: string
  rows: CourseHistoryRow[]
}

/** 최신 날짜부터 — 같은 날 안에서는 시작 시각 늦은 것부터(서버 순서를 믿지 않고 정렬한다) */
export const groupRunsByDay = (rows: CourseHistoryRow[]): RunDayGroup[] => {
  const sorted = [...rows].sort((a, b) => b.startDt.localeCompare(a.startDt))
  const groups: RunDayGroup[] = []
  for (const row of sorted) {
    const last = groups[groups.length - 1]
    if (last?.date === dayOf(row)) last.rows.push(row)
    else groups.push({ date: dayOf(row), rows: [row] })
  }
  return groups
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** `'2026-11-11'` → `'11.11 (수)'` */
export const formatRunDay = (date: string): string =>
  `${format(parseISO(date), 'MM.dd')} (${WEEKDAYS[parseISO(date).getDay()]})`
