import { points } from '../mock/pointData'
import type { PointType } from '../types'
import PointListCard from './PointListCard'

const PointList = ({
  selected,
  onSelectPoint,
}: {
  selected: PointType | null
  onSelectPoint: React.Dispatch<React.SetStateAction<PointType | null>>
}) => {
  return (
    <div className="flex flex-col">
      {points.map((v, i) => (
        <PointListCard
          key={`point` + i}
          point={v}
          selected={selected}
          idx={i + 1}
          onClick={(value) => onSelectPoint(value)}
        />
      ))}
    </div>
  )
}

export default PointList
