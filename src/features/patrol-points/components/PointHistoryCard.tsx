import { format } from 'date-fns'

import AppBadge from '@/components/app/AppBadge'
import type { PointPatrolType } from '@/pages/service/patrol/points/PatrolPointsPage'

import { pointAuthMethodBadge, patrolPointResultBadge } from './PointColumn'

/**
 * 지점 이력의 **좁은 폭(`xl` 미만) 카드** (`spec 030` T447).
 *
 * 🔴 **컬럼이 8개로 가장 많은 화면이다.** 전부 쌓으면 카드 하나가 화면을 덮는다 —
 * 지점명(식별) + 결과·인증(상태)을 앞에 두고 나머지는 **한 줄에 묶는다**.
 *
 * 🔴 **`onRecordClick` 을 받는 팩토리다**(`pointColumns` 와 같은 모양). 기록 뱃지는
 * 모달을 여는 **버튼**이라 핸들러가 필요하다.
 * ⚠️ 이 화면은 `onRowClick` 이 **없어서**(행 클릭 동작이 없다) `AppTable` 이 카드를
 * `div` 로 그린다 — 그래서 안에 버튼을 두어도 **버튼 중첩이 되지 않는다.** 나중에 행
 * 클릭이 생기면 카드가 `button` 이 되므로 **이 버튼을 밖으로 빼야 한다.**
 *
 * ⚠️ 아직 mock 위다(`PointPatrolType` 의 `Date`) — `spec 024` 전환 때 매핑만 손본다.
 */

export const pointHistoryCard =
  (onRecordClick: (patrol: PointPatrolType) => void) => (patrol: PointPatrolType) => {
    const result = patrolPointResultBadge[patrol.result]
    const auth = pointAuthMethodBadge[patrol.authMethod]
    // 미완료는 시각이 없다 — 테이블에서도 `—` 로 비운다
    const time = patrol.result === 'INCOMPLETE' ? null : format(patrol.patrolAt, 'HH:mm')

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body font-semibold text-foreground">{patrol.pointName}</span>
          <AppBadge variant={result.variant}>{result.label}</AppBadge>
          <AppBadge variant={auth.variant}>{auth.label}</AppBadge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
          <span>{patrol.zoneName}</span>
          <span className="tabular-nums">
            {format(patrol.patrolAt, 'yyyy-MM-dd')}
            {time && ` ${time}`}
          </span>
          <span>{patrol.worker}</span>
        </div>

        {/* 🔴 기록이 0건이면 **버튼을 만들지 않는다** — 눌러도 아무 일이 없는 버튼이 된다 */}
        {patrol.records.length > 0 && (
          <button type="button" className="w-fit" onClick={() => onRecordClick(patrol)}>
            <AppBadge variant="point">{`기록 ${patrol.records.length}건`}</AppBadge>
          </button>
        )}
      </div>
    )
  }
