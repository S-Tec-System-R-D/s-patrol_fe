import { CheckCircle2Icon, ClockIcon, FootprintsIcon, TriangleAlertIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'

import { formatDuration } from '../../lib/elapsed'
import { formatRate, type CourseHistoryStats } from '../../lib/courseHistoryStats'
import { HISTORY_DAYS } from '../../lib/historyRange'

/**
 * 코스 KPI 4종 (`spec 023` 코스 상세 B단).
 *
 * 🔴🔴 **인증률 미달을 경고로 바꾸지 않는다.** 지점 상태에 **`순찰제외`(2)** 가 있고
 * (백엔드 전달 2026-10-12), `pointCount` 가 그것을 **빼고 센 값인지 미확인**이다. 순찰에서
 * 빼기로 한 지점이 분모에 있으면 **영원히 100% 가 안 되는 코스**가 생기고, 그걸 빨갛게
 * 칠하면 관리자는 매번 없는 문제를 찾는다. 확인할 데이터가 생기기 전까지 인증률은
 * **그냥 두 수의 비**다(tone 고정).
 *
 * 🔴 **미인증은 경고색을 쓴다** — 그건 서버가 `status=3`(미완료)로 **직접 센 건수**이고
 * 우리 계산이 아니다. 즉 색을 입힐 근거가 있는 쪽과 없는 쪽을 구분한다.
 *
 * 🔴 **빈 상태를 "0" 으로 적지 않는다.** 이력이 아예 없으면 평균·인증률은 `—` 다 —
 * `0분`·`0%` 로 적으면 "순찰했는데 결과가 0" 으로 읽힌다.
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
      tone="point"
    />
    <AppKpiCard
      icon={ClockIcon}
      label="평균 소요시간"
      value={formatDuration(stats.avgElapsedSec)}
      tone="point"
    />
    <AppKpiCard
      icon={CheckCircle2Icon}
      label="지점 인증률"
      value={formatRate(stats.authRate)}
      // 🔴 tone 을 비율에 따라 바꾸지 않는다 — 위 블록 주석(순찰제외)
      tone="success"
    />
    <AppKpiCard
      icon={TriangleAlertIcon}
      label="미인증 지점"
      value={uncheckedCount ?? '—'}
      unit={uncheckedCount === undefined ? undefined : '건'}
      tone={uncheckedCount ? 'warning' : 'point'}
    />
  </div>
)

export default CourseKpiRow
