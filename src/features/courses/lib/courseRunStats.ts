import { isValid, parseISO } from 'date-fns'

import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 코스 상세 오른쪽 카드 2종의 집계(`spec 074` T1230). 🔴 **받은 회차 목록(최근 30일 · 최대 100건)만 센다** —
 * 요청을 더 하지 않는다. 100건을 넘으면 최근 100건 기준이다(KPI 와 같은 한계).
 */

const pad = (hour: number) => String(hour).padStart(2, '0')

/** 시작 시각의 시(0~23)별 회차 수 */
export const hourlyCounts = (rows: CourseHistoryRow[]): number[] => {
  const counts = Array.from({ length: 24 }, () => 0)
  for (const row of rows) {
    const parsed = parseISO(row.startDt)
    if (isValid(parsed)) counts[parsed.getHours()] += 1
  }
  return counts
}

const range = (from: number, to: number) => (from === to ? `${pad(from)}시` : `${pad(from)}–${pad(to)}시`)

/**
 * `09–17시` 와 `18–08시 기록 없음`. 🔴 **하루를 고리로 보고 가장 긴 빈 구간을 뺀 나머지가 순찰 시간대다** — 야간 순찰은
 * 자정을 넘는다(23시 · 02시). 첫 · 마지막 시로 자르면 `02–23시` 처럼 하루 전체가 순찰 시간대로 읽힌다.
 * 순찰 시간대 안의 빈 시는 막대가 보여 준다. 기록이 없으면 `null`.
 */
export const hourSpan = (counts: number[]): { active: string; empty: string | null } | null => {
  const hours = counts.length
  if (counts.every((count) => count === 0)) return null
  if (counts.every((count) => count > 0)) return { active: range(0, hours - 1), empty: null }

  // 가장 긴 빈 구간(고리) — 시작 · 길이
  let bestStart = 0
  let bestLength = 0
  for (let start = 0; start < hours; start += 1) {
    if (counts[start] > 0 || counts[(start + hours - 1) % hours] === 0) continue
    let length = 0
    while (length < hours && counts[(start + length) % hours] === 0) length += 1
    if (length > bestLength) {
      bestStart = start
      bestLength = length
    }
  }

  const emptyTo = (bestStart + bestLength - 1) % hours
  const activeFrom = (emptyTo + 1) % hours
  const activeTo = (bestStart + hours - 1) % hours
  return { active: range(activeFrom, activeTo), empty: range(bestStart, emptyTo) }
}

export interface WorkerStat {
  /** `userSeq` · 근무자 없는 회차는 `null` */
  userSeq: number | null
  userName: string | null
  /** 참여한 회차 전부(교대 포함) */
  runs: number
  /** 그중 교대 회차(근무자 2명 이상) */
  handovers: number
  /** 🔴 혼자 끝낸 회차만의 인증 · 지점 합 */
  checked: number
  points: number
}

/**
 * 근무자별 회차 수 · 인증 비율.
 * 🔴🔴 **인증률은 혼자 끝낸 회차로만 센다 · 교대 회차는 회차 수에만 든다**(사용자 결정 2026-11-13) — 목록 행의
 * `checkedCount` 는 회차 합계라 누가 몇 곳을 찍었는지 나눌 수 없다. 양쪽에 통째로 넣으면 6곳 중 3곳을 찍고
 * 넘긴 사람도 6/6 이 된다. 정확한 사람별 값은 서버 집계가 있어야 한다.
 * 근무자 없는 회차(`userList` 빈 배열, 실존)는 맨 아래 한 행.
 */
export const workerStats = (rows: CourseHistoryRow[]): WorkerStat[] => {
  const byUser = new Map<number, WorkerStat>()
  const none: WorkerStat = { userSeq: null, userName: null, runs: 0, handovers: 0, checked: 0, points: 0 }

  const add = (stat: WorkerStat, row: CourseHistoryRow, handover: boolean) => {
    stat.runs += 1
    if (handover) {
      stat.handovers += 1
      return
    }
    stat.checked += row.checkedCount
    stat.points += row.pointCount
  }

  for (const row of rows) {
    if (row.userList.length === 0) {
      add(none, row, false)
      continue
    }
    const users = [...new Map(row.userList.map((user) => [user.userSeq, user])).values()]
    const handover = users.length > 1
    for (const user of users) {
      const stat = byUser.get(user.userSeq) ?? {
        userSeq: user.userSeq,
        userName: user.userName,
        runs: 0,
        handovers: 0,
        checked: 0,
        points: 0,
      }
      add(stat, row, handover)
      byUser.set(user.userSeq, stat)
    }
  }

  const named = [...byUser.values()].sort((a, b) => b.runs - a.runs)
  return none.runs > 0 ? [...named, none] : named
}

/** 인증 비율(0~1). 분모 0 이면 `null` */
export const checkRatio = (checked: number, points: number): number | null =>
  points > 0 ? Math.min(checked / points, 1) : null
