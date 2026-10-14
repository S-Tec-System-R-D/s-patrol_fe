import { CheckCircle2Icon, ClockIcon, FootprintsIcon, TriangleAlertIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'

import { formatDuration } from '../../lib/elapsed'
import { formatRate, type CourseHistoryStats } from '../../lib/courseHistoryStats'
import { HISTORY_DAYS } from '../../lib/historyRange'

/**
 * 코스 KPI 4종 (`spec 023` 코스 상세 B단 → **`spec 031` 에서 공용 카드로 재정렬**).
 *
 * 🔴🔴 **인증률 미달을 경고로 바꾸지 않는다.** 지점 상태에 **`순찰제외`(2)** 가 있고
 * `pointCount` 가 그것을 **빼고 센 값인지 미확인**이다. 순찰에서 빼기로 한 지점이 분모에
 * 있으면 **영원히 100% 가 안 되는 코스**가 생기고, 그걸 빨갛게 칠하면 관리자는 매번 없는
 * 문제를 찾는다. 🔴 **031 에서 바를 붙였지만 색은 여전히 중립**이다 — 같은 이유다.
 *
 * 🔴 **미인증은 경고색을 쓴다** — 그건 서버가 `status=3`(미완료)로 **직접 센 건수**이고
 * 우리 계산이 아니다. 즉 색을 입힐 근거가 있는 쪽과 없는 쪽을 구분한다.
 *
 * 🔴 **빈 상태를 "0" 으로 적지 않는다.** 이력이 아예 없으면 평균·인증률은 `—` 다 —
 * `0분`·`0%` 로 적으면 "순찰했는데 결과가 0" 으로 읽힌다. **그때 바도 그리지 않는다.**
 *
 * ⚠️ **`spec 031` 은 모양만 바꿨다** — 숫자·문구는 그대로다(`tasks.md` 제약 7).
 */

interface CourseKpiRowProps {
  stats: CourseHistoryStats
  /** 미인증 지점 건수(서버 `totalCount`). 조회 전이면 `undefined` */
  uncheckedCount?: number
}

const CourseKpiRow = ({ stats, uncheckedCount }: CourseKpiRowProps) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <AppKpiCard
      icon={FootprintsIcon}
      label={`${HISTORY_DAYS}일 순찰 수행`}
      value={stats.runCount}
      unit="회"
      /* 🔴 **"전월 대비" 를 만들지 않는다**(OQ-031-A) — 이전 30일을 한 번 더 조회해야
         하고, 그 값을 쓸 화면 결정이 아직 없다. 요청을 늘리는 대신 비워 둔다 */
    />
    <AppKpiCard
      icon={ClockIcon}
      label="평균 소요시간"
      value={formatDuration(stats.avgElapsedSec)}
      /* ⚠️ 목업의 `기준 45분` 은 **지금 쓸 수 없다**(OQ-031-B) — 기준이 `totalMin` 인데
         그 값이 구간시간 합과 어긋나 있다(7개 중 4개, `spec 033`) */
      compactValue
    />
    <AppKpiCard
      icon={CheckCircle2Icon}
      label="지점 인증률"
      value={formatRate(stats.authRate)}
      /* 🔴 **바를 그리는 유일한 칸** — 인증률은 비율 그 자체다. 다른 칸은 기준값이 없어
         바를 그리려면 없는 수를 지어내야 한다. `authRate` 가 `null`(분모 0)이면
         `AppKpiCard` 가 바를 **그리지 않는다** */
      ratio={stats.authRate}
      /* 분자·분모를 그대로 보여 준다 — 비율만 있으면 "몇 건 중 몇 건" 을 알 수 없다 */
      hint={stats.pointSum > 0 ? `전체 인증 ${stats.checkedSum} / ${stats.pointSum}건` : undefined}
      // 🔴 tone 을 비율에 따라 바꾸지 않는다 — 위 블록 주석(순찰제외)
    />
    <AppKpiCard
      icon={TriangleAlertIcon}
      label="미인증 지점"
      value={uncheckedCount ?? '—'}
      unit={uncheckedCount === undefined ? undefined : '건'}
      tone={uncheckedCount ? 'warning' : 'neutral'}
    />
  </div>
)

export default CourseKpiRow
