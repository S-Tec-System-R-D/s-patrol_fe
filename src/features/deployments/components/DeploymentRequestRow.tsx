import { useState } from 'react'
import { ArrowRightIcon, CheckIcon, UserIcon, XIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import RejectRequestForm from '../form/RejectRequestForm'
import { useApproveDeployment } from '../hooks/useApproveDeployment'
import type { DeploymentRequestRow as DeploymentRequestRowData } from '../types/deployment'

interface DeploymentRequestRowProps {
  request: DeploymentRequestRowData
  siteSeq: number
}

/** `'2026-05-30T10:20:00'` → `'2026-05-30'` */
const formatDate = (value: string): string => value.slice(0, 10)

/**
 * 배치 요청 카드형 row (`spec 039` T641).
 *
 * 아바타는 `WorkerAvatar`(색상 해시)가 아니라 장식 아이콘이다 — 요청자는 아직 이 사업장 소속이 아니다(014).
 *
 * 🔴 **승인은 확인 모달 없이 즉시다**(014 결정 유지 · 사용자 확인 2026-10-21). 되돌릴 수 없으므로
 * **처리 중에는 두 버튼을 모두 막고**(연타 방지), 승인·거부 사이 간격을 둔다(오클릭 방지).
 */
const DeploymentRequestRow = ({ request, siteSeq }: DeploymentRequestRowProps) => {
  const approval = useApproveDeployment(siteSeq)
  const [rejectOpen, setRejectOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-warning-bg text-warning">
          <UserIcon size={18} strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-foreground">{request.userName}</span>
            <AppBadge variant="muted">{request.requestTypeName}</AppBadge>
          </span>
          <span className="flex min-w-0 items-center gap-1 text-caption text-muted-foreground">
            <span className="truncate">{request.fromSiteName}</span>
            <ArrowRightIcon size={12} className="shrink-0" aria-label="에서" />
            <span className="truncate">{request.toSiteName}</span>
            <span className="truncate">· 사유: {request.reason}</span>
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="tabular-nums text-caption text-muted-foreground">
          {formatDate(request.requestDt)}
        </span>
        <AppButton
          icon={CheckIcon}
          onClick={() => approval.mutate(request)}
          disabled={approval.isPending}
          aria-label={`${request.userName} 승인`}
        >
          승인
        </AppButton>
        <AppDialog
          title="배치 요청 거부"
          description={`${request.userName}님의 ${request.requestTypeName} 요청을 거부하는 사유를 입력해주세요.`}
          open={rejectOpen}
          onOpenChange={setRejectOpen}
          trigger={
            <AppButton
              icon={XIcon}
              variant="destructive"
              disabled={approval.isPending}
              aria-label={`${request.userName} 거부`}
            >
              거부
            </AppButton>
          }
        >
          <RejectRequestForm
            request={request}
            siteSeq={siteSeq}
            onSuccess={() => setRejectOpen(false)}
          />
        </AppDialog>
      </div>
    </div>
  )
}

export default DeploymentRequestRow
