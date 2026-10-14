import { format } from 'date-fns'

import AppBadge from '@/components/app/AppBadge'
import type { ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'

import { patrolResultBadge } from './ZoneColumn'

/**
 * 코스 이력의 **좁은 폭(`xl` 미만) 카드** (`spec 030` T446).
 *
 * ⚠️ **이 화면은 아직 mock 위에 있다**(`ZonePatrolType` 의 `Date` 필드, 클라이언트 필터).
 * `spec 025`(코스 순찰이력)가 서버로 전환하면 **필드명이 바뀐다** — 카드 **구조는 그대로
 * 두고 매핑만** 손볼 수 있게 단순하게 유지한다(`tasks.md` 제약 6).
 *
 * 🔴 **종료 일시를 비워 두지 않는다.** 진행 중이면 `—` 가 아니라 **"진행 중"** 이라고
 * 적는다 — 테이블에서는 같은 열의 다른 행과 비교돼 `—` 가 읽히지만, 카드에서는 그 줄
 * 하나만 보이므로 **값이 빠진 것처럼** 읽힌다.
 */

const ZoneHistoryCard = (zone: ZonePatrolType) => {
  const { variant, label } = patrolResultBadge[zone.result]
  const inProgress = zone.result === 'IN_PROGRESS'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body font-semibold text-foreground">{zone.name}</span>
        <AppBadge variant={variant}>{label}</AppBadge>
      </div>

      <div className="flex flex-col gap-0.5 text-caption text-muted-foreground tabular-nums">
        <span>시작 {format(zone.startedAt, 'yyyy-MM-dd HH:mm:ss')}</span>
        <span>
          종료 {inProgress ? '진행 중' : format(zone.endedAt, 'yyyy-MM-dd HH:mm:ss')}
        </span>
      </div>
    </div>
  )
}

export default ZoneHistoryCard
