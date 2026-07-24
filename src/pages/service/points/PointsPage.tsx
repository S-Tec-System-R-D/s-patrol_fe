import PointTopNav from '@/features/points/components/PointTopNav'
import { useState } from 'react'

import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import CourseTabs from '@/features/zone/components/CourseTabs'
import PointDetail from '@/features/points/components/detail/PointDetail'
import PointList from '@/features/points/components/PointList'
import { points } from '@/features/points/mock/pointData'
import type { PointType } from '@/features/points/types'
import { MapPinIcon } from 'lucide-react'

const PointsPage = () => {
  // mock 동기 import — lazy init으로 첫 렌더부터 첫 항목 선택(기존 effect와 동등).
  const [selectedPoint, setSelectedPoint] = useState<PointType | null>(
    () => points[0] ?? null
  )

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="코스/지점" subtitle="순찰 코스와 지점을 구성하고 관리합니다" />

      <CourseTabs />

      <div className="flex-1 w-full flex min-h-0 overflow-hidden rounded-lg border border-border">
        {/* 지점목록 */}
        <div className="flex flex-col w-300 border-r min-h-0 overflow-hidden  ">
          {/* 헤더 */}
          <PointTopNav />
          {/* 바디 */}
          <PointList onSelectPoint={setSelectedPoint} selected={selectedPoint} />
        </div>
        {/* 선택한 지점정보 */}
        {selectedPoint ? (
          <PointDetail point={selectedPoint} />
        ) : (
          <AppEmpty
            icon={MapPinIcon}
            title="지점을 생성해주세요"
            description="지점을 생성하여 목록에서 클릭하면 상세정보가 표시됩니다"
          />
        )}
      </div>
    </div>
  )
}

export default PointsPage
