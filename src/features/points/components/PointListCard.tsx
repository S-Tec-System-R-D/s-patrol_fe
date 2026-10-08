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
 *
 * 🔴 **미사용(`useYn: false`) 지점을 톤다운해 구분한다**(OQ-022-G 해소, 사용자 결정
 * 2026-10-08). 실측(Phase 8 R2·R3)에서 **서버가 미사용 지점을 목록에서 제외하지 않는
 * 것**이 확인됐다 — `useYn: false` 로 만든 지점이 필터 없는 조회에 그대로 내려온다.
 * 따라서 구분은 **프론트 책임**이다.
 *
 * 표시 방식: **회색 처리만**(뱃지 추가 안 함). 행에 이미 인증수단 뱃지가 있어 뱃지를
 * 하나 더 두면 좌측 340px 에서 지점 이름이 더 잘린다 — 톤다운은 폭을 쓰지 않는다.
 * 🔴 다만 `design-system.md` §3 "색만으로 상태 전달 금지" 때문에 **스크린리더용 텍스트를
 * 함께 둔다.** 시각적으로는 아무것도 늘지 않는다(`sr-only`).
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
  const inactive = !point.useYn

  /** 미사용이면 인증수단 뱃지도 함께 톤다운한다 — 행 안에서 강조가 하나만 튀면 더 어색하다 */
  const badgeVariant = inactive
    ? 'muted'
    : method === 'QR'
      ? 'point'
      : method === 'NFC'
        ? 'success'
        : 'muted'

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
        ${inactive && !selected ? 'opacity-60' : ''}
        `}
      >
        {idx}
      </div>
      <div
        className={`flex-1 min-w-0 truncate text-body font-semibold
        ${inactive ? 'text-muted-foreground' : ''}`}
      >
        {point.pointName}
        {/* 색·명도만으로 전달하지 않는다 — design-system.md §3 */}
        {inactive && <span className="sr-only"> (미사용)</span>}
      </div>
      {/* 표시할 라벨이 없으면 뱃지를 숨긴다 — 없는 인증수단 이름을 만들지 않는다(A1) */}
      {badgeLabel && <AppBadge variant={badgeVariant}>{badgeLabel}</AppBadge>}
    </button>
  )
}

export default PointListCard
