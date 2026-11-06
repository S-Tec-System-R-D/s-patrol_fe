import { toSeconds } from './elapsed'

import type { CourseHistoryRow } from '../types'

/**
 * 코스 순찰 통계 — **프론트 집계** (`spec 023` 코스 상세 B단).
 *
 * 🔴🔴 **서버에 집계 엔드포인트가 없다.** 행을 받아 우리가 더한다(사용자 결정
 * 2026-10-12: "6개월·1년 조회가 생기면 그때 API 를 요청한다"). 그래서 **기간이 30일로
 * 고정**이고, 그 안에서는 코스당 수십 행이라 한 요청으로 끝난다.
 *
 * 🔴 **화면에 "우리가 더한 수치" 임을 적는다.** 서버가 계산한 값이 아니므로 다른 화면
 * (관리 리포트 등)과 어긋날 수 있고, 그때 출처를 알 수 있어야 한다.
 *
 * 🔴 **순수 함수로 꺼냈다** — 집계가 컴포넌트 안에 있으면 "완료인데 인증 0", "근무자
 * 없음", "시 단위 소요시간" 같은 **실측된 예외**를 테스트로 고정할 수 없다.
 */

/** KPI 미니 그래프에 그리는 회차 수 */
export const RECENT_RUN_LIMIT = 7

/** 미니 그래프의 한 회차 */
export interface RecentRun {
  startDt: string
  /** 🔴 읽을 수 없으면 `null` — 0 으로 그리면 "0분" 으로 읽힌다 */
  elapsedSec: number | null
  overtime: boolean
  checkedCount: number
  pointCount: number
}

export interface CourseHistoryStats {
  /** 조회 기간의 순찰 횟수. 🔴 **집계에 쓴 행 수가 아니라 서버의 `totalCount`** 다 */
  runCount: number
  /** 평균 소요(초). 소요시간을 읽을 수 없는 행은 **제외**한다 — 0 으로 섞으면 평균이 내려간다 */
  avgElapsedSec: number | null
  /** 인증률 분자·분모. 🔴 분모 0 이면 비율을 만들지 않는다 */
  checkedSum: number
  pointSum: number
  /** 0~1. 🔴 **분모가 0 이면 `null`** — `0%` 로 적으면 "하나도 못 했다" 로 읽힌다 */
  authRate: number | null
  /** 집계에 **실제로 쓴 행 수**. `runCount` 보다 작으면 일부만 본 것이다 */
  sampledCount: number
  /**
   * 🔴 **한 페이지로 다 못 받았다**는 표시. 이때 평균·인증률은 **최근 N건 기준**이고,
   * 화면이 그렇게 적어야 한다 — 전체 기간 값으로 보이면 거짓이다.
   */
  partial: boolean
  /**
   * 상태별 건수 (`spec 031` 확장) — **구성을 보여주기 위한 값**이다.
   *
   * 🔴 **`runCount`(서버 `totalCount`)와 합이 다를 수 있다.** 이건 **받아 온 행**을 센
   * 값이라, `partial` 이면 표본 기준이다. 화면은 둘을 **같은 수로 취급하면 안 된다**.
   * 🔴 코스 사전: `0` 진행중 · `1` 완료 · `2` 미완료(지점 사전과 값이 겹치는데 뜻이 다르다 — B-7).
   */
  statusCounts: { done: number; inProgress: number; failed: number }
  /**
   * 소요시간 **최단·최장**(초). 🔴 **읽을 수 있는 행이 없으면 `null`** —
   * 평균과 같은 규칙이다(0 으로 섞으면 "0초 순찰" 이 생긴다).
   */
  minElapsedSec: number | null
  maxElapsedSec: number | null
  /** 가장 최근 회차. 🔴 **행이 없으면 `null`** — 응답 순서에 기대지 않고 시작 시각으로 고른다 */
  lastRunDt: string | null
  /** 기준 시간을 넘긴 회차 수 — 서버 `overtimeYn` 을 센다. `partial` 이면 표본 기준이다 */
  overtimeCount: number
  /** 최근 회차 — 🔴 **오래된 순**이다(그래프의 왼쪽 → 오른쪽). 시작 시각으로 고른다 */
  recentRuns: RecentRun[]
}

/**
 * @param rows   받아온 이력 행(한 페이지)
 * @param totalCount 서버가 준 전체 건수 — `rows.length` 와 다를 수 있다
 */
export const courseHistoryStats = (
  rows: CourseHistoryRow[],
  totalCount: number
): CourseHistoryStats => {
  const elapsed = rows.map((row) => toSeconds(row.actualElapsedTime)).filter(
    (sec): sec is number => sec !== null
  )

  const checkedSum = rows.reduce((sum, row) => sum + row.checkedCount, 0)
  const pointSum = rows.reduce((sum, row) => sum + row.pointCount, 0)

  /**
   * 🔴 **모르는 상태값을 어느 쪽에도 넣지 않는다.** 실측된 코스 사전은 0·1·2 뿐이고
   * (api-spec §4), 그 밖의 값이 오면 **세 칸 어디에도 더하지 않는다** — 임의로 "미완료"
   * 에 넣으면 화면이 없는 실패를 보여준다(A1).
   */
  const statusCounts = {
    done: rows.filter((row) => row.status === 1).length,
    inProgress: rows.filter((row) => row.status === 0).length,
    failed: rows.filter((row) => row.status === 2).length,
  }

  const recentRuns = [...rows]
    .sort((a, b) => a.startDt.localeCompare(b.startDt))
    .slice(-RECENT_RUN_LIMIT)
    .map((row) => ({
      startDt: row.startDt,
      elapsedSec: toSeconds(row.actualElapsedTime),
      overtime: row.overtimeYn,
      checkedCount: row.checkedCount,
      pointCount: row.pointCount,
    }))

  return {
    runCount: totalCount,
    avgElapsedSec:
      elapsed.length === 0
        ? null
        : Math.round(elapsed.reduce((sum, sec) => sum + sec, 0) / elapsed.length),
    checkedSum,
    pointSum,
    // 🔴 분모 0 → null. 지점 0개 코스를 돈 이력이 있으면 실제로 일어난다
    authRate: pointSum === 0 ? null : checkedSum / pointSum,
    sampledCount: rows.length,
    partial: totalCount > rows.length,
    statusCounts,
    minElapsedSec: elapsed.length === 0 ? null : Math.min(...elapsed),
    maxElapsedSec: elapsed.length === 0 ? null : Math.max(...elapsed),
    lastRunDt: recentRuns.at(-1)?.startDt ?? null,
    overtimeCount: rows.filter((row) => row.overtimeYn).length,
    recentRuns,
  }
}

/** 0~1 → `96.7%`. 🔴 `null` 은 `—` 다 — `0%` 와 구분한다 */
export const formatRate = (rate: number | null): string =>
  rate === null ? '-' : `${(rate * 100).toFixed(1)}%`
