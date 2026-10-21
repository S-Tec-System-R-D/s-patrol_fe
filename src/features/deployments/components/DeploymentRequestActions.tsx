import { useState } from 'react'
import { CheckIcon, XIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import RejectRequestForm from '../form/RejectRequestForm'
import { useApproveDeployment } from '../hooks/useApproveDeployment'
import type { DeploymentRequestRow } from '../types/deployment'

/** 필터 트리거와 같은 치수 — `h-8` · `px-3` · `rounded-md` */
const ROW_BUTTON_CLASS = 'h-8 gap-1.5 rounded-md px-3 py-0'

interface DeploymentRequestActionsProps {
  request: DeploymentRequestRow
  siteSeq: number
}

/**
 * 요청 1건의 승인·거부 버튼 (`spec 039` T641·T649e).
 *
 * 🔴 **행마다 자기 mutation 을 든다** — 처리 중 상태가 그 행에만 걸려야 한다(다른 요청은 계속 누를 수
 * 있다). 그래서 표의 셀이 아니라 **컴포넌트**다(셀 렌더 함수에서는 훅을 부를 수 없다).
 *
 * 🔴 **승인은 확인 모달 없이 즉시다**(014 결정 유지 · 사용자 확인 2026-10-21). 되돌릴 수 없으므로
 * **처리 중에는 두 버튼을 모두 막고**(연타 방지), 승인·거부 사이 간격을 둔다(오클릭 방지).
 * 버튼은 **필터와 같은 높이(`h-8`)**(사용자 요청 2026-10-21).
 */
const DeploymentRequestActions = ({ request, siteSeq }: DeploymentRequestActionsProps) => {
  const approval = useApproveDeployment(siteSeq)
  const [rejectOpen, setRejectOpen] = useState(false)

  return (
    <div className="flex items-center justify-end gap-3">
      <AppButton
        icon={CheckIcon}
        iconSize={14}
        className={ROW_BUTTON_CLASS}
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
            iconSize={14}
            className={ROW_BUTTON_CLASS}
            variant="destructive"
            disabled={approval.isPending}
            aria-label={`${request.userName} 거부`}
          >
            거부
          </AppButton>
        }
      >
        <RejectRequestForm request={request} siteSeq={siteSeq} onSuccess={() => setRejectOpen(false)} />
      </AppDialog>
    </div>
  )
}

export default DeploymentRequestActions
