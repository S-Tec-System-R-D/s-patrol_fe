import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notify } from '@/lib/notify'
import { updateDeploymentEndDate } from '../api/updateDeploymentEndDate'
import { deploymentKeys } from '../queryKeys'
import type { DeploymentHistoryRow } from '../types/deployment'

/**
 * 복귀일 지정 (`spec 039` T656) — 승인·거부와 같은 규약(`useApproveDeployment` 머리말).
 *
 * - 🔴 **비옵티미스틱** — 복귀일에 따라 상태(배치중 → 복귀완료)와 KPI 인원이 바뀐다. 서버가 계산한
 *   상태를 다시 받아야 숫자가 맞는다 → `all(siteSeq)` 무효화
 * - 실패 토스트는 전역 `MutationCache` 가 띄운다(중복 방지). 모달은 **성공해야 닫는다**(호출부)
 */
export const useUpdateDeploymentEndDate = (siteSeq: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ row, endDt }: { row: DeploymentHistoryRow; endDt: string }) =>
      updateDeploymentEndDate({ historySeq: row.historySeq, endDt }),
    onSuccess: (_data, { row, endDt }) => {
      notify.success(`${row.userName}님의 복귀일을 ${endDt} 로 지정했습니다.`)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: deploymentKeys.all(siteSeq) }),
  })
}
