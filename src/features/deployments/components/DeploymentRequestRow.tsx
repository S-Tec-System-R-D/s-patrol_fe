import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import { notify } from '@/lib/notify'
import { CheckIcon, UserIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import RejectRequestForm from '../form/RejectRequestForm'
import { useDeploymentStore } from '../store/deploymentStore'
import type { DeploymentRequestSummary } from '../types/deployment'

interface DeploymentRequestRowProps {
  request: DeploymentRequestSummary
}

/**
 * 배치 요청 카드형 row. 아바타는 013 `WorkerAvatar`(색상 해시)와 구분되는 장식용 아이콘 —
 * 요청자는 아직 이 사업장 소속이 아닌 타 사업장 근무자라 색상 배정 대상이 아니다(spec.md §3).
 */
const DeploymentRequestRow = ({ request }: DeploymentRequestRowProps) => {
  const approve = useDeploymentStore((state) => state.approve)
  const [rejectOpen, setRejectOpen] = useState(false)

  const handleApprove = () => {
    approve(request.id)
    notify.success(`${request.workerName}님의 배치 요청을 승인했습니다.`)
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-warning-bg text-warning">
          <UserIcon size={18} strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {request.fromLocationName} · {request.workerName}
          </span>
          <span className="truncate text-caption text-muted-foreground">
            {request.toLocationName}로 배치 요청 · 사유: {request.reason}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-caption text-muted-foreground">{request.requestedAt}</span>
        <AppButton icon={CheckIcon} onClick={handleApprove}>
          승인
        </AppButton>
        <AppDialog
          title="배치 요청 거부"
          description={`${request.workerName}님의 배치 요청을 거부하는 사유를 입력해주세요.`}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          trigger={
            <AppButton icon={XIcon} variant="destructive">
              거부
            </AppButton>
          }
        >
          <RejectRequestForm request={request} onSuccess={() => setRejectOpen(false)} />
        </AppDialog>
      </div>
    </div>
  )
}

export default DeploymentRequestRow
