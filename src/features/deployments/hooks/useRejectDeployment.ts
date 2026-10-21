import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notify } from '@/lib/notify'
import { rejectDeploymentRequest } from '../api/rejectDeploymentRequest'
import { rejectReturnRequest } from '../api/rejectReturnRequest'
import { deploymentKeys } from '../queryKeys'
import type { RequestKind } from '../types/deployment'
import { REQUEST_KIND_LABEL } from './useApproveDeployment'

/**
 * 배치 요청 거부 (`spec 039` T643·T644·T645) — 승인과 같은 규약(`useApproveDeployment` 머리말).
 *
 * ⚠️ 차이 하나: 거부는 **모달 안**에서 일어난다. 모달을 닫는 일은 호출부(폼)가 `onSuccess` 에서 한다 —
 * 🔴 **성공해야 닫는다**(029 규약). 먼저 닫으면 실패했을 때 입력한 사유가 사라진다.
 * 거부는 이력을 만들지 않지만 요약(대기)·요청이 바뀌므로 무효화 범위는 승인과 같다.
 */
export const useRejectDeployment = (siteSeq: number, kind: RequestKind = 'deploy') => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestSeq,
      rejectReason,
    }: {
      requestSeq: number
      userName: string
      rejectReason: string
    }) =>
      kind === 'return'
        ? rejectReturnRequest({ requestSeq, rejectReason })
        : rejectDeploymentRequest({ requestSeq, rejectReason }),
    onSuccess: (_data, { userName }) => {
      notify.success(`${userName}님의 ${REQUEST_KIND_LABEL[kind]} 요청을 거부했습니다.`)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: deploymentKeys.all(siteSeq) }),
  })
}
