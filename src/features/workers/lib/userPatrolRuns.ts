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


/** 교대 — 처리한 사람이 둘 이상. ⚠️ 교대받고 하나도 처리하지 않은 사람은 `userList` 에 없다(spec 제약 2) */
export const hasHandOver = (row: CourseHistoryRow): boolean => row.userList.length > 1

/**
 * 🔴 **요약 · 차트는 끝난 회차만 센다**(D14) — 진행 중 회차는 아직 안 간 지점 때문에 인증 %를 낮추고,
 * 차트에서 빼면 요약 숫자와 막대 합계가 어긋난다. 아래 회차 목록에는 진행 중도 그대로 나온다.
 */
export const endedRuns = (rows: CourseHistoryRow[]): CourseHistoryRow[] =>
  rows.filter((row) => row.status !== COURSE_HISTORY_STATUS.IN_PROGRESS)

const isIncomplete = (row: CourseHistoryRow) => row.status === COURSE_HISTORY_STATUS.INCOMPLETE

export interface RunSummary {
  runs: number
  points: number
  checked: number
  incomplete: number
  overtime: number
}

export const summarizeRuns = (rows: CourseHistoryRow[]): RunSummary => {
  const ended = endedRuns(rows)
  return {
    runs: ended.length,
    points: ended.reduce((sum, row) => sum + row.pointCount, 0),
    checked: ended.reduce((sum, row) => sum + row.checkedCount, 0),
    incomplete: ended.filter(isIncomplete).length,

    overtime: ended.filter((row) => row.overtimeYn).length,
  }
}

/**
 * 하루 칸 — 🔴 **상태와 시간초과는 서로 다른 기준이다**(D14). 완료에도 미완료에도 시간초과가 있을 수 있어
 * 한 막대를 세 색으로 나누면 어느 쪽 합계든 어긋난다. `completed + incomplete` = 그 날 끝난 회차 수(막대 높이),
 * `overtime` 은 그 가운데 시간초과 수(막대 위 숫자) — 겹쳐 센다.
 */
export interface RunDayBucket {
  date: string // 'yyyy-MM-dd'
  completed: number
  incomplete: number
  overtime: number
}

const dayOf = (row: CourseHistoryRow) => row.startDt.slice(0, 10)

/** 오늘 포함 14일 — 기록 없는 날도 0 칸으로 둔다(막대 자리가 비어야 "안 했다" 가 보인다) */
export const runDayBuckets = (rows: CourseHistoryRow[], today: Date, days: number = RUN_DAYS): RunDayBucket[] => {
  const ended = endedRuns(rows)
  return Array.from({ length: days }, (_, i) => {
    const date = format(subDays(today, days - 1 - i), 'yyyy-MM-dd')
    const dayRows = ended.filter((row) => dayOf(row) === date)
    const incomplete = dayRows.filter(isIncomplete).length
    return {
      date,
      completed: dayRows.length - incomplete,
      incomplete,
      overtime: dayRows.filter((row) => row.overtimeYn).length,
    }
  })
}

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
