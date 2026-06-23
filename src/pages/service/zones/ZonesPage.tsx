import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppButton from '@/components/app/AppButton'
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
  // 구역목록 선택 시 state담아서 컨텐츠로 넘겨주야함

  /**
   * 필요 내용 및 기능
   * 1. view : 순찰구역 목록, 선택된 구역정보
   *  1-1 순찰구역목록 :
   *  1-2 선택된 구역정보 : 구역명, 설명, 순찰시간, 교대허용 on/off, 사용여부 on/off
   * 2. create : 순찰구역 추가(지점 목록 불러와서 선택하는 방식)
   * 3. edit
   *   - 순찰구역 수정(지점 순서 변경은 드래그앤드롭)
   *   - 지점 추가 : 1. 시트를 만들어서 드래그앤드롭, 2. 모달에서 선택하여 불러온다음 순서변경
   *
   * 4. delete : 순찰구역 삭제
   *
   *
   */

  return (
    <div className="flex flex-1 ">
      <ZoneSideBar selected={selectedZone} onSelect={setSelectedZone} />
      <div className="flex-1 flex flex-col">
        {selectedZone ? (
          <>
            <ZoneTopNav zone={selectedZone} />
            <div className="flex flex-col gap-4 p-8">
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
              <CourseTotal points={selectedZone.points} />
            </div>
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
  )
}

export default ZonesPage

const CourseTotal = ({ points }: { points: ZonePointType[] }) => {
  return (
    <div className="flex items-center justify-between border rounded-sm bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ClockIcon size={16} />
        <span>
          사용지점 {points.filter((v) => v.isActive === true).length} / {points.length} 개
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-semibold">총 소요시간</span>
        <span className="text-point font-bold text-lg">
          {points.reduce((acc, cur) => acc + cur.timeLimit, 0)} 분
        </span>
      </div>
    </div>
  )
}
