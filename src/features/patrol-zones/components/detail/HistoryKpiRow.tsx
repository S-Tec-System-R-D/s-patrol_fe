import { ClockIcon, MapPinIcon, MessageSquareTextIcon, TimerIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'
import { formatDuration, formatElapsed } from '@/features/course-history/lib/elapsed'
import type { CheckIntervals } from '@/features/course-history/lib/checkIntervals'
import type { CourseAverage } from '@/features/course-history/lib/courseAverage'
import { POINT_HISTORY_STATUS } from '@/features/course-history/types'
import type { CheckDetailRow, CourseHistoryDetail } from '@/features/course-history/types'

/**
 * 회차 상세 KPI 4종 (`spec 036` T511).
 *
 * 🔴🔴 **"기준 충족" 판정을 하지 않는다**(spec §3-4). `totalMin` 은 **검증되지 않고**(B-31)
 * 어긋난 데이터가 **전수 18건**이며 `0` 인 코스도 실재한다. 값을 나란히 보여 주되
 * **초과/충족을 말하지 않는다** — 근거를 확신할 수 없을 때 판정을 입히면 관리자는
 * **없는 문제**를 찾는다(023 의 "인증률에 색을 입히지 않는다" 와 같은 판단).
 *
 * 🔴 **미인증에는 경고색을 쓴다** — 그건 서버가 센 `completedPointCount` 와 `totalPointCount`
 * 의 차이고 우리 계산이 아니다. 즉 색을 입힐 근거가 있는 쪽과 없는 쪽을 구분한다(031 승계).
 *
 * 🔴 **없는 값을 `0` 으로 적지 않는다.** 인증이 1건 이하면 간격을 만들 수 없고, 그때는
 * `—` 다 — `0분` 으로 적으면 "0분 만에 돌았다" 로 읽힌다. **그때 바도 그리지 않는다.**
 */

interface HistoryKpiRowProps {
  detail: CourseHistoryDetail
  /** `CheckDetails` 행. 조회 전이면 빈 배열 */
  checks: CheckDetailRow[]
  intervals: CheckIntervals
  /** 같은 코스의 완료 건 평균. 조회 전이면 `undefined` */
  average?: CourseAverage
}

const HistoryKpiRow = ({ detail, checks, intervals, average }: HistoryKpiRowProps) => {
  const missing = Math.max(detail.totalPointCount - detail.completedPointCount, 0)

  /** 🔴 **미인증 지점 이름**을 하나 집어 준다 — 숫자만 있으면 "어디가" 가 빠진다 */
  const missingName = checks.find(
    (row) => row.status === POINT_HISTORY_STATUS.INCOMPLETE
  )?.pointName

  const memoCount = checks.reduce((sum, row) => sum + row.memos.length, 0)
  const photoCount = checks.reduce(
    (sum, row) => sum + row.memos.reduce((n, memo) => n + (memo.attaches?.length ?? 0), 0),
    0
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AppKpiCard
        icon={MapPinIcon}
        label="지점 인증"
        value={detail.completedPointCount}
        unit={`/ ${detail.totalPointCount}개`}
        /* 🔴 **구성**이라 색을 쓴다 — 조각이 서버가 센 상태값이다(비율 바와 다르다) */
        bar={{
          kind: 'segments',
          parts: [
            { label: '인증', value: detail.completedPointCount, tone: 'done' },
            { label: '미인증', value: missing, tone: 'fail' },
          ],
        }}
        foot={{
          left: `인증 ${detail.completedPointCount}`,
          right: missing === 0 ? '미인증 없음' : `${missingName ?? '미인증'} 외 ${missing - 1}건`,
        }}
        tone={missing > 0 ? 'warning' : 'neutral'}
      />

      <AppKpiCard
        icon={ClockIcon}
        label="소요시간"
        value={formatElapsed(detail.elapsedTime)}
        compactValue
        /**
         * 🔴 **기준과 평균을 나란히 적기만 한다.** 뱃지로 "기준 충족" 을 달지 않는다.
         * ⚠️ `totalMin: 0` 인 코스가 실재해 **"기준 0분" 이라고 쓰지 않는다** — 설정이
         * 안 된 것과 0분은 다르다.
         */
        hint={[
          detail.totalMin > 0 ? `기준 ${detail.totalMin}분` : '기준 미설정',
          average === undefined
            ? null
            : average.averageSeconds === null
              ? '코스 평균 —'
              : `코스 평균 ${formatDuration(average.averageSeconds)}${
                  average.partial ? ' (최근 100회)' : ''
                }`,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      <AppKpiCard
        icon={MessageSquareTextIcon}
        label="특이사항"
        value={memoCount}
        unit="건"
        /* 🔴 메모가 없으면 바를 그리지 않는다 — 빈 바는 "0점" 으로 읽힌다 */
        bar={
          memoCount === 0
            ? null
            : {
                kind: 'segments',
                parts: [{ label: '메모', value: memoCount, tone: 'progress' }],
              }
        }
        foot={memoCount === 0 ? undefined : { left: `메모 ${memoCount}`, right: `사진 ${photoCount}` }}
        tone={memoCount > 0 ? 'warning' : 'neutral'}
      />

      <AppKpiCard
        icon={TimerIcon}
        label="구간 평균 간격"
        /* 🔴 간격을 만들 수 없으면 `—` 다 — `0분` 은 "0분 만에 돌았다" 로 읽힌다 */
        value={intervals.averageSeconds === null ? '-' : formatDuration(intervals.averageSeconds)}
        compactValue
        bar={
          intervals.averageSeconds === null ||
          intervals.shortestSeconds === null ||
          intervals.longestSeconds === null
            ? null
            : {
                kind: 'range',
                min: intervals.shortestSeconds,
                max: intervals.longestSeconds,
                value: intervals.averageSeconds,
              }
        }
        foot={
          intervals.shortestSeconds === null || intervals.longestSeconds === null
            ? undefined
            : {
                left: `최단 ${formatDuration(intervals.shortestSeconds)}`,
                right: `최장 ${formatDuration(intervals.longestSeconds)}`,
              }
        }
        /* 🔴 **뺀 행 수를 밝힌다** — 조용히 빼면 8개 지점 코스의 평균이 2개로 계산됐는데도
           그냥 평균처럼 보인다 */
        hint={
          intervals.skippedRows === 0
            ? `인증 ${intervals.intervalCount + 1}건 기준`
            : `인증 시각이 없는 ${intervals.skippedRows}개 제외`
        }
      />
    </div>
  )
}

export default HistoryKpiRow
