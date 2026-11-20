import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 오늘 순찰 집계 — `spec 084`(대시보드 가운데 칸의 `오늘 시간대별 순찰` · `오늘 코스별 순찰`).
 *
 * 🔴 **새로 받지 않는다** — 대시보드가 이미 받는 어제~오늘 회차(`useRecentCourses` — 최대 100건)에서 센다.
 * 🔴 **시작 시각 기준이다** — 오늘 시작한 회차를 센다(진행 중 · 끝난 것 모두). 어제 시작해 오늘 끝난 회차는 들어가지 않는다.
 * 🔴 **100건 상한** — 받은 것이 딱 100건이면 더 있을 수 있다. 화면이 `최근 100건 기준` 이라고 적는다(`isCapped`).
 */

/** 서버 상한 — `useRecentCourses` 가 받는 `pageSize` 와 같다 */
export const RECENT_COURSE_CAP = 100

/** 받은 건수가 상한에 닿았나 — 닿았으면 집계가 실제보다 적을 수 있다 */
export const isCapped = (rows: CourseHistoryRow[]): boolean => rows.length >= RECENT_COURSE_CAP

/** 오늘 시작한 회차 — `today` 는 `yyyy-MM-dd` */
const startedToday = (rows: CourseHistoryRow[], today: string): CourseHistoryRow[] =>
  rows.filter((row) => row.startDt.startsWith(today))

/** 0~23시 칸마다 오늘 시작한 회차 수. 시각을 읽을 수 없는 행은 세지 않는다 */
export const countByHour = (rows: CourseHistoryRow[], today: string): number[] => {
  const hours = Array<number>(24).fill(0)
  for (const row of startedToday(rows, today)) {
    // ISO 8601(타임존 없음) `yyyy-MM-ddTHH:mm:ss` 의 시 — Date 로 바꾸지 않는다(타임존 해석이 끼어든다)
    // 🔴 빈 문자열은 `Number('')` 가 0 이라 0시로 세진다 — 두 자리 숫자인지부터 본다
    const text = row.startDt.slice(11, 13)
    if (!/^\d{2}$/.test(text)) continue
    const hour = Number(text)
    if (hour < 24) hours[hour] += 1
  }
  return hours
}

export interface CourseCount {
  courseSeq: number
  courseName: string
  count: number
}

/**
 * 코스마다 오늘 시작한 회차 수 — 많은 순, 같으면 이름 순.
 *
 * `courses`(코스 목록)를 주면 **오늘 한 번도 안 돈 코스도 0회로** 넣는다 — "안 돌았다"가 정보다.
 * 목록을 못 받았으면(`undefined`) 오늘 돈 코스만 준다. 목록에 없는 코스(지워졌거나 목록이 잘린 경우)는 기록의 이름으로 넣는다.
 */
export const countByCourse = (
  rows: CourseHistoryRow[],
  today: string,
  courses?: { courseSeq: number; courseName: string }[]
): CourseCount[] => {
  const counts = new Map<number, CourseCount>()
  for (const course of courses ?? []) {
    counts.set(course.courseSeq, { courseSeq: course.courseSeq, courseName: course.courseName, count: 0 })
  }
  for (const row of startedToday(rows, today)) {
    const found = counts.get(row.courseSeq)
    if (found) found.count += 1
    else counts.set(row.courseSeq, { courseSeq: row.courseSeq, courseName: row.courseName, count: 1 })
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.courseName.localeCompare(b.courseName, 'ko'))
}
