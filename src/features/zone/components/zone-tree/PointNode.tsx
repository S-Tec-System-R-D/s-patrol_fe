import { MapPinIcon } from 'lucide-react'
// 🔴 `features/zone/types` 는 `PointType` 을 re-export 하지 않는다(`ZonePointType` 만).
// 원 소유처에서 직접 가져온다 — 027 에서 typecheck 를 고치며 드러난 끊긴 import 다.
import type { PointType } from '@/features/points/types'

export const PointNode = ({ point }: { point: PointType }) => {
  return (
    <div className="flex items-center gap-2 px-8 py-2 hover:bg-muted">
      <MapPinIcon className="text-muted-foreground" size={16} strokeWidth={1.5} />
      {point.title}
    </div>
  )
}
