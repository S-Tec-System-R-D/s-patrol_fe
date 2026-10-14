import { RouteIcon } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'

import AppBadge from '@/components/app/AppBadge'

import { resolveAuthMethodLabel, toAuthMethodLabel } from '../lib/authMethod'
import type { PointRow } from '../types'

/**
 * 지점 목록의 **좁은 폭(`xl` 미만) 카드** (`spec 030` T445).
 *
 * 🔴 컬럼 5개를 세로로 쌓지 않는다 — 식별(지점명)과 상태(뱃지)를 앞에, 비교용 수치는
 * 한 줄로(`spec.md` §3 규칙 5). 셸은 `AppTable` 이 그린다.
 */

const formatPatrolDt = (value: string | null): string | null => {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : null
}

const PointCard = (point: PointRow) => {
  const label = resolveAuthMethodLabel(point.authMethod, point.authMethodName)
  const method = toAuthMethodLabel(point.authMethod)
  const lastPatrol = formatPatrolDt(point.lastPatrolDt)

  // 테이블과 같은 규칙 — 미사용이면 뱃지도 함께 톤다운한다
  const methodVariant = !point.useYn
    ? 'muted'
    : method === 'QR'
      ? 'point'
      : method === 'NFC'
        ? 'success'
        : 'muted'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-body font-semibold ${point.useYn ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {point.pointName}
        </span>
        {point.useYn ? (
          <AppBadge variant="success">사용</AppBadge>
        ) : (
          <AppBadge variant="muted">미사용</AppBadge>
        )}
        {/* 라벨이 없으면 뱃지를 숨긴다 — 없는 인증수단 이름을 만들지 않는다(A1) */}
        {label && <AppBadge variant={methodVariant}>{label}</AppBadge>}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <RouteIcon size={13} strokeWidth={1.75} />
          <span className="tabular-nums">소속 코스 {point.usedCount}개</span>
        </span>
      </div>

      <span className="text-caption text-muted-foreground/80 tabular-nums">
        최근 순찰 {lastPatrol ?? '기록 없음'}
      </span>
    </div>
  )
}

export default PointCard
