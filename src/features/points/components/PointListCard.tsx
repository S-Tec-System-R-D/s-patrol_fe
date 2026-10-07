import AppBadge from '@/components/app/AppBadge'
import { resolveAuthMethodLabel, toAuthMethodLabel } from '../lib/authMethod'
import type { PointRow } from '../types'

/**
 * 지점 목록 행.
 *
 * 🔴 목록 응답의 이름 필드는 **`pointName`** 이다(상세는 `name` — B-4). 둘을 맞추지
 * 않기로 했고(`spec 022` §3 규칙 5), 이 컴포넌트는 목록 타입만 받는다.
 *
 * `selected`를 객체가 아니라 **boolean**으로 받는다. 022 전까지는 `PointType | null`을
 * 받아 참조 동등(`point === selected`)으로 비교했는데, 서버 응답은 재조회마다 새 객체라
 * 그 방식이면 선택 표시가 사라진다.
 */
const PointListCard = ({
  point,
  idx,
  selected,
  onClick,
}: {
  point: PointRow
  idx: number
  selected: boolean
  onClick: (pointSeq: number) => void
}) => {
  const badgeLabel = resolveAuthMethodLabel(point.authMethod, point.authMethodName)
  const method = toAuthMethodLabel(point.authMethod)

  return (
    <button
      type="button"
      onClick={() => onClick(point.pointSeq)}
      className={`w-full flex items-center gap-2.5 py-[11px] px-3.5 text-left
      not-last:border-b border-border/50 transition-colors
      ${selected ? 'bg-point-bg' : 'hover:bg-muted'}
      `}
    >
      <div
        className={`flex items-center justify-center
        w-[22px] h-[22px] aspect-square shrink-0 rounded-md
        text-[11px] font-medium
        ${selected ? 'bg-point text-white' : 'bg-muted text-muted-foreground'}
        `}
      >
        {idx}
      </div>
      <div className="flex-1 min-w-0 truncate text-body font-semibold">{point.pointName}</div>
      {/* 표시할 라벨이 없으면 뱃지를 숨긴다 — 없는 인증수단 이름을 만들지 않는다(A1) */}
      {badgeLabel && (
        <AppBadge variant={method === 'QR' ? 'point' : method === 'NFC' ? 'success' : 'muted'}>
          {badgeLabel}
        </AppBadge>
      )}
    </button>
  )
}

export default PointListCard
