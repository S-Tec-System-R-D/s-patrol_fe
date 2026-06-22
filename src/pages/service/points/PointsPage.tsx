import PointTopNav from '@/features/points/components/PointTopNav'
import { useState } from 'react'

import PointEmptyCard from '@/features/points/components/PointEmptyCard'
import PointDetail from '@/features/points/components/detail/PointDetail'
import PointList from '@/features/points/components/PointList'
import { points } from '@/features/points/mock/pointData'
import type { PointType } from '@/features/points/types'

const PointsPage = () => {
  // TODO: 선택지점관리를 여기서 할건지 상태로할건지 구분해야함
  // mock 동기 import — lazy init으로 첫 렌더부터 첫 항목 선택(기존 effect와 동등).
  const [selectedPoint, setSelectedPoint] = useState<PointType | null>(
    () => points[0] ?? null
  )

  return (
    <div className="flex-1 w-full flex min-h-0  overflow-hidden ">
      {/* 지점목록 */}
      <div className="flex flex-col w-300 border-r min-h-0 overflow-hidden  ">
        {/* 헤더 */}
        <PointTopNav />
        {/* 바디 */}
        <PointList onSelectPoint={setSelectedPoint} selected={selectedPoint} />
      </div>
      {/* 선택한 지점정보 */}
      {selectedPoint ? <PointDetail point={selectedPoint} /> : <PointEmptyCard />}
    </div>
  )
}

export default PointsPage
