import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppButton from '@/components/app/AppButton'
import AppPageHeader from '@/components/app/AppPageHeader'
import CourseTabs from '@/features/zone/components/CourseTabs'
import CourseDiagramCard from '@/features/zone/components/CourseDiagramCard'
import PointCard from '@/features/zone/components/PointCard'
import ZoneSideBar from '@/features/zone/components/ZoneSideBar'
import ZoneTopNav from '@/features/zone/components/ZoneTopNav'
import AddPointForm from '@/features/zone/form/AddPointForm'
import { ZoneTreeData } from '@/features/zone/mocks/zoneData'
import type { ZonePointType, ZoneType } from '@/features/zone/types'

import { ClockIcon, MapIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'

const ZonesPage = () => {
  // mock 동기 import — lazy init으로 첫 렌더부터 첫 항목 선택(기존 effect와 동등).
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(
    () => ZoneTreeData[0] ?? null
  )

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="코스/지점" subtitle="순찰 코스와 지점을 구성하고 관리합니다" />

      <CourseTabs />

      <div className="flex items-start gap-6">
        <ZoneSideBar selected={selectedZone} onSelect={setSelectedZone} />

        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {selectedZone ? (
            <>
              <ZoneTopNav zone={selectedZone} />

              <div className="hidden md:block">
                <CourseDiagramCard points={selectedZone.points} />
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
                <span className="text-panel-title font-semibold">지점 순서 · 편집</span>
                <div className="flex flex-col gap-2">
                  {selectedZone.points.map((v, i) => (
                    <PointCard key={i} data={v} />
                  ))}
                  <AppDialog
                    title="구역 내 지점 추가"
                    description="구역 내 신규 지점을 추가합니다."
                    trigger={
                      <AppButton icon={PlusIcon} size="full" variant="dash">
                        지점 추가
                      </AppButton>
                    }
                  >
                    <AddPointForm currentPoints={selectedZone.points} />
                  </AppDialog>
                </div>
              </div>

              <CourseTotal points={selectedZone.points} />
            </>
          ) : (
            <AppEmpty
              icon={MapIcon}
              title="선택된 구역이 없습니다"
              description="좌측에서 구역을 선택하거나 새로 생성해주세요"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default ZonesPage

const CourseTotal = ({ points }: { points: ZonePointType[] }) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-body">
        <ClockIcon size={16} />
        <span>
          사용지점 {points.filter((v) => v.isActive === true).length} / {points.length} 개
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-semibold text-body">총 소요시간</span>
        <span className="text-point font-bold text-panel-header">
          {points.reduce((acc, cur) => acc + cur.timeLimit, 0)} 분
        </span>
      </div>
    </div>
  )
}
