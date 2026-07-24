import { Switch } from '@/components/ui/switch'
import { SquarePenIcon } from 'lucide-react'
import type { ZoneType } from '../types'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import EditZoneForm from '../form/EditZoneForm'

const ZoneTopNav = ({ zone }: { zone: ZoneType }) => {
  return (
    <div className="flex items-center justify-between w-full rounded-lg border border-border bg-card p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-panel-header font-semibold">{zone.title}</span>
        </div>
        <span className="text-muted-foreground text-caption">
          {zone.description} · {zone.points.length}개 지점
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-body">교대허용</label>
          <Switch checked={zone.isRotation} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-body">코스 활성화</label>
          <Switch checked={zone.isActive} />
        </div>

        <AppDialog
          title="구역 수정"
          description="순찰 구역 정보를 수정합니다."
          trigger={
            <AppButton variant="sub" className="bg-card">
              <SquarePenIcon size={14} strokeWidth={1.5} />
              코스 수정
            </AppButton>
          }
        >
          <EditZoneForm />
        </AppDialog>
      </div>
    </div>
  )
}

export default ZoneTopNav
