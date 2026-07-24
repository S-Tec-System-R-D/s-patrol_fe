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
    <div
      className={`relative
    flex items-center gap-4 py-4 px-7.5 not-last:border-b border-border/50 hover:bg-muted cursor-pointer
    ${isSelected ? 'bg-muted' : ''}
    `}
      onClick={() => onClick(point)}
    >
      {isSelected && <div className={`absolute left-0 top-0 w-1 h-full bg-primary`} />}

      <div
        className={`flex items-center justify-center
        w-8 h-8 aspect-square shrink-0 rounded-sm
        text-body font-medium
        ${isSelected ? 'bg-point-bg text-point-foreground' : 'bg-muted text-muted-foreground'}
        `}
      >
        {idx}
      </div>
      <div className="flex-1 text-body font-medium">{point.title}</div>
      <AppBadge variant={point.authenticationMethod === 'QR' ? 'point' : 'success'}>
        {point.authenticationMethod}
      </AppBadge>
    </div>
  )
}

export default PointListCard
