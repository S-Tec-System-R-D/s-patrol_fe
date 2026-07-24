import AppDialog from '@/components/app/AppDialog'
import type { PointPatrolType } from '@/pages/service/patrol/points/PatrolPointsPage'
import { format } from 'date-fns'
import { ImageIcon } from 'lucide-react'

interface PatrolRecordDialogProps {
  patrol: PointPatrolType | null
  onOpenChange: (open: boolean) => void
}

const PatrolRecordDialog = ({ patrol, onOpenChange }: PatrolRecordDialogProps) => {
  if (!patrol) return null

  return (
    <AppDialog
      open={!!patrol}
      onOpenChange={onOpenChange}
      title="순찰 기록 상세"
      description={`${patrol.pointName} · ${format(patrol.patrolAt, 'yyyy-MM-dd HH:mm')}`}
    >
      <div className="flex flex-col gap-3 overflow-y-auto">
        <div className="flex flex-col divide-y divide-border/60">
          <InfoRow label="순찰코스" value={patrol.zoneName} />
          <InfoRow label="순찰자" value={patrol.worker} />
        </div>

        {patrol.records.map((record, index) => (
          <section
            key={record.recordedAt.toISOString()}
            className="flex flex-col gap-2 rounded-md border border-border p-3"
          >
            <h4 className="text-label font-medium uppercase tracking-wide text-muted-foreground">
              기록 {index + 1} · {format(record.recordedAt, 'HH:mm')}
            </h4>
            <p className="text-sm text-foreground">{record.content}</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">
                첨부 사진 ({record.photoCount}/{record.maxPhotoCount})
              </span>
              <div className="flex gap-2">
                {Array.from({ length: record.photoCount }).map((_, photoIndex) => (
                  <div
                    key={photoIndex}
                    className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted text-muted-foreground"
                  >
                    <ImageIcon size={16} strokeWidth={1.5} />
                    <span className="text-[10px]">사진{photoIndex + 1}</span>
                  </div>
                ))}
                {record.photoCount === 0 && (
                  <span className="text-xs text-muted-foreground">첨부된 사진이 없습니다</span>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </AppDialog>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 text-body">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
)

export default PatrolRecordDialog
