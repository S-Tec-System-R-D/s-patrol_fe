import { PlusIcon } from 'lucide-react'

import type { ZoneType } from '../types'

import AddZoneForm from '../form/AddZoneForm'
import AppDialog from '@/components/app/AppDialog'
import { ZoneTree } from './zone-tree/ZoneTree'

const ZoneSideBar = ({
  selected,
  onSelect,
}: {
  selected: ZoneType | null
  onSelect: React.Dispatch<React.SetStateAction<ZoneType | null>>
}) => {
  return (
    <div className="w-72 shrink-0 rounded-lg border border-border bg-card">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <span className="text-panel-title font-semibold">코스 목록</span>
        <AppDialog
          title="구역 생성"
          description="순찰 구역을 생성합니다."
          trigger={
            <PlusIcon
              className={`p-1 border rounded-sm  text-muted-foreground
                hover:bg-muted cursor-pointer
                `}
              strokeWidth={1.5}
            />
          }
        >
          <AddZoneForm />
        </AppDialog>
      </div>
      {/* 바디 */}
      <ZoneTree selected={selected} onSelect={onSelect} />
    </div>
  )
}

export default ZoneSideBar
