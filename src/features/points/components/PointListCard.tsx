import AppBadge from '@/components/app/AppBadge'
import type { PointType } from '../types'

const PointListCard = ({
  point,
  idx,
  selected,
  onClick,
}: {
  point: PointType
  idx: number
  selected: PointType | null
  onClick: (value: PointType) => void
}) => {
  const isSelected = point === selected
  return (
    <button
      type="button"
      onClick={() => onClick(point)}
      className={`w-full flex items-center gap-2.5 py-[11px] px-3.5 text-left
      not-last:border-b border-border/50 transition-colors
      ${isSelected ? 'bg-point-bg' : 'hover:bg-muted'}
      `}
    >
      <div
        className={`flex items-center justify-center
        w-[22px] h-[22px] aspect-square shrink-0 rounded-md
        text-[11px] font-medium
        ${isSelected ? 'bg-point text-white' : 'bg-muted text-muted-foreground'}
        `}
      >
        {idx}
      </div>
      <div className="flex-1 min-w-0 truncate text-body font-semibold">{point.title}</div>
      <AppBadge variant={point.authenticationMethod === 'QR' ? 'point' : 'success'}>
        {point.authenticationMethod}
      </AppBadge>
    </button>
  )
}

export default PointListCard
