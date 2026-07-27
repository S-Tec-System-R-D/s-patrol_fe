import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppDialog from '@/components/app/AppDialog'
import { roleLabel, userStatusLabel, workStatusLabel } from '@/types/enum'
import { KeyRoundIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import EditWorkerForm from '../form/EditWorkerForm'
import type { Worker, WorkerAssignmentHistoryItem } from '../types/worker'
import WorkerAvatar from './WorkerAvatar'

const historyLabel = (item: WorkerAssignmentHistoryItem) =>
  `${item.toLocationName} ${item.type === 'RETURN' ? '복귀' : '배치'}`

const toYearMonth = (date: string) => date.slice(0, 7).replace('-', '.')

const historyPeriod = (item: WorkerAssignmentHistoryItem) =>
  `${toYearMonth(item.startedAt)} ~ ${item.endedAt ? toYearMonth(item.endedAt) : '현재'}`

const WorkerDetailPanel = ({ worker }: { worker: Worker }) => {
  const displayLocation = worker.isAssignedElsewhere
    ? (worker.currentAssignedLocation?.name ?? worker.locationName)
    : worker.locationName

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <WorkerAvatar id={worker.id} name={worker.name} className="h-10 w-10" />
        <div className="flex flex-col">
          <span className="text-panel-title font-bold text-foreground">{worker.name}</span>
          <span className="text-caption text-muted-foreground">
            {worker.locationName} · {roleLabel[worker.role]}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-1">
        <h4 className="text-label font-medium uppercase tracking-wide text-muted-foreground">
          기본정보
        </h4>
        <div className="flex flex-col divide-y divide-border/60">
          <AppDetailRow label="연락처" value={worker.phone} />
          <AppDetailRow label="소속 사업장" value={displayLocation} />
          <AppDetailRow label="근무 상태" value={workStatusLabel[worker.workStatus]} />
          <AppDetailRow
            label="사용자 상태"
            value={
              <AppBadge variant={worker.status === 'ACTIVE' ? 'success' : 'muted'}>
                {userStatusLabel[worker.status]}
              </AppBadge>
            }
          />
          <AppDetailRow label="등록일" value={worker.registeredAt} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h4 className="flex items-center gap-1.5 text-label font-medium uppercase tracking-wide text-muted-foreground">
          배치 변경 이력
          <AppBadge variant="muted">{worker.assignmentHistory.length}</AppBadge>
        </h4>
        {worker.assignmentHistory.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {worker.assignmentHistory.map((item) => (
              <li key={item.id} className="flex items-start gap-2 text-body">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-point" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{historyLabel(item)}</span>
                  <span className="text-caption text-muted-foreground">
                    {historyPeriod(item)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground">이력 없음</p>
        )}
      </section>

      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
        <AppAlertDialog
          icon={KeyRoundIcon}
          title="비밀번호를 초기화하시겠습니까?"
          description="초기화된 비밀번호는 근무자 앱으로 안내됩니다."
          onAction={() => {}}
        >
          <AppButton icon={KeyRoundIcon} variant="sub" size="full">
            비밀번호
          </AppButton>
        </AppAlertDialog>

        <AppDialog
          title="근무자 수정"
          description="근무자 정보를 수정할 수 있습니다."
          trigger={
            <AppButton icon={SquarePenIcon} variant="sub" size="full">
              수정
            </AppButton>
          }
        >
          <EditWorkerForm worker={worker} />
        </AppDialog>

        <AppAlertDialog
          size="sm"
          icon={Trash2Icon}
          variant="destructive"
          title="근무자를 삭제하시겠습니까?"
          onAction={() => {}}
        >
          <AppButton icon={Trash2Icon} variant="destructive" size="full">
            근무자 삭제
          </AppButton>
        </AppAlertDialog>
      </div>
    </div>
  )
}

export default WorkerDetailPanel
