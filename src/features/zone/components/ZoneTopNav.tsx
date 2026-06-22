import { Switch } from '@/components/ui/switch'
import { SquarePenIcon } from 'lucide-react'
import type { ZoneType } from '../types'
import { format } from 'date-fns'
import AppDialog from '@/components/app/AppDialog'
import EditZoneForm from '../form/EditZoneForm'

const ZoneTopNav = ({ zone }: { zone: ZoneType }) => {
  // 구역에서 선택한 목록 넘겨받을예정

  return (
    <div className="flex items-center justify-between w-full bg-background border-b p-4">
      <div className="flex items-center gap-4 ">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-medium">{zone.title}</span>
            <span className="text-xs p-1 bg-blue-400/20 rounded-sm">
              {zone.points.length}개 지점
            </span>
          </div>
          <span className="text-muted-foreground text-xs">
            지점생성 {format(zone.createdAt, 'yyyy.MM.dd')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground">교대 허용</label>
          <Switch checked={zone.isRotation} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground">구역 활성화</label>
          <Switch checked={zone.isActive} />
        </div>

        {/* NOTE: 일단 모달로 선택하는 방식 / 순서는 드래그 */}

        <AppDialog
          title="구역 수정"
          description="순찰 구역 정보를 수정합니다."
          trigger={
            <SquarePenIcon
              className={`w-9 h-9 p-2 border rounded-sm  text-muted-foreground
                hover:bg-muted cursor-pointer
                `}
              size={16}
              strokeWidth={1.5}
            />
          }
        >
          <EditZoneForm />
        </AppDialog>
      </div>
    </div>
  )
}

export default ZoneTopNav
