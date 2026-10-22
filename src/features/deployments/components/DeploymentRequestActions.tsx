import { CheckIcon, XIcon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppButton from '@/components/app/AppButton'
import { REQUEST_KIND_LABEL, useApproveDeployment } from '../hooks/useApproveDeployment'
import type { RequestKind } from '../types/deployment'

/** 필터 트리거와 같은 치수 — `h-8` · `px-3` · `rounded-md` */
const ROW_BUTTON_CLASS = 'h-8 gap-1.5 rounded-md px-3 py-0'

interface DeploymentRequestActionsProps {
  /** 배치 · 복귀 — 버튼·확인창은 같고 API 만 다르다(T659) */
  kind?: RequestKind
  assignmentSeq: number
  userName: string
  siteSeq: number
}

/**
 * 요청 1건의 승인·반려 버튼 (`spec 039` T641·T649e · T659 에서 배치/복귀 공용 · `spec 042` T714).
 *
 * 🔴 **행마다 자기 mutation 을 든다** — 처리 중 상태가 그 행에만 걸려야 한다(다른 요청은 계속 누를 수
 * 있다). 그래서 표의 셀이 아니라 **컴포넌트**다(셀 렌더 함수에서는 훅을 부를 수 없다).
 *
 * 🔴 **승인은 확인 모달 없이 즉시다**(014 결정 유지 · 사용자 확인 2026-10-21). 되돌릴 수 없으므로
 * **처리 중에는 두 버튼을 모두 막고**(연타 방지), 승인·반려 사이 간격을 둔다(오클릭 방지).
 * 버튼은 **필터와 같은 높이(`h-8`)**(사용자 요청 2026-10-21).
 *
 * 🔴 **반려는 사유 입력 없이 확인창**이다(`spec 042`) — 서버에 사유 필드가 없다(사용자 결정 2026-10-21).
 * 반려는 되돌릴 수 없고 이력에도 남지 않아 한 번 묻는다.
 */
const DeploymentRequestActions = ({
  kind = 'deploy',
  assignmentSeq,
  userName,
  siteSeq,
}: DeploymentRequestActionsProps) => {
  const process = useApproveDeployment(siteSeq, kind)
  const label = REQUEST_KIND_LABEL[kind]

  return (
    <div className="flex items-center justify-end gap-3">
      <AppButton
        icon={CheckIcon}
        iconSize={14}
        className={ROW_BUTTON_CLASS}
        onClick={() => process.mutate({ assignmentSeq, userName, approved: true })}
        disabled={process.isPending}
        aria-label={`${userName} 승인`}
      >
        승인
      </AppButton>
      <AppAlertDialog
        size="sm"
        icon={XIcon}
        variant="destructive"
        title={`${label} 요청을 반려하시겠습니까?`}
        description={`${userName}님의 ${label} 요청을 반려합니다. 반려한 요청은 되돌릴 수 없습니다.`}
        actionLabel="반려"
        onAction={() => process.mutate({ assignmentSeq, userName, approved: false })}
      >
        <AppButton
          icon={XIcon}
          iconSize={14}
          className={ROW_BUTTON_CLASS}
          variant="destructive"
          disabled={process.isPending}
          aria-label={`${userName} 반려`}
        >
          반려
        </AppButton>
      </AppAlertDialog>
    </div>
  )
}

export default DeploymentRequestActions
