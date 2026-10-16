import { toSeconds } from './elapsed'
import { MAX_PAGE_SIZE } from './courseHistoryListParams'
import type { CourseHistoryRow } from '../types'

/**
 * 코스 평균 소요시간 (`spec 036` T498).
 *
 * 목업 `02` 의 KPI "코스 평균 47분" 자리다. 🔴 **집계 엔드포인트가 없어서 프론트가 더한다**
 * — 사용자 결정 2026-10-16("이력을 긁어서 평균내는 방향으로 하자").
 *
 * 🔴 **완료 건만 센다**(`eventType=1`). 미완료를 섞으면 평균이 내려앉는다 — 중단된 순찰의
 * 소요시간은 "그 코스를 도는 데 걸리는 시간" 이 아니다. 실측 사업장 6 에서 **54건 중 30건이
 * 미완료**라, 섞으면 평균이 절반 가까이 틀린다.
 *
 * 🔴 **`pageSize` 상한이 100 이다**(`api-spec.md` §1-5). 그래서 **페이지를 루프하지 않고**
 * 첫 100건으로 계산하고 `partial` 로 알린다 — 화면이 "최근 100회 평균" 이라고 적을 수 있게.
 * 루프하면 코스 하나의 KPI 한 칸 때문에 요청이 몇 번이고 나간다(023 이 30일로 묶은 것과
 * 같은 판단: 기간·건수가 더 필요해지면 **서버 집계를 요청**한다).
 *
 * ⚠️ **`actualElapsedTime` 에 시 단위가 온다**(`"02:17:40"`) — `toSeconds` 가 세 토막을
 * 모두 센다. 분으로 가정해 앞 두 자리만 읽으면 2시간이 **2분**이 된다.
 */

export interface CourseAverage {
  /** 평균 소요 **초**. 셀 수 있는 행이 하나도 없으면 `null`(0 이 아니다 — 0초 순찰과 섞인다) */
  averageSeconds: number | null
  /** 평균에 실제로 들어간 건수 */
  countedRuns: number
  /** 🔴 `true` 면 **전체가 아니다** — 화면은 "최근 N회 평균" 으로 적는다 */
  partial: boolean
}

/**
 * @param rows       `GetCourseHistory?courseSeq=&eventType=1` 의 행(완료 건)
 * @param totalCount 같은 응답의 `totalCount`. 100 을 넘으면 `partial`
 */
export const courseAverage = (rows: CourseHistoryRow[], totalCount: number): CourseAverage => {
  const seconds = rows
    .map((row) => toSeconds(row.actualElapsedTime))
    .filter((value): value is number => value !== null)

  return {
    averageSeconds:
      seconds.length === 0
        ? null
        : Math.round(seconds.reduce((sum, value) => sum + value, 0) / seconds.length),
    countedRuns: seconds.length,
    partial: totalCount > MAX_PAGE_SIZE,
  }
}
