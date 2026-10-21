import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notify } from '@/lib/notify'
import { approveDeploymentRequest } from '../api/approveDeploymentRequest'
import { deploymentKeys } from '../queryKeys'
import type { DeploymentRequestRow } from '../types/deployment'

/**
 * 배치 요청 승인 (`spec 039` T642~T644) — 🔴 A급이라 세 단계를 나눠 적는다.
 *
 * **① 제출(T642)** — 🔴 **비옵티미스틱**(023 승계). 승인은 다른 사업장 사람의 소속을 바꾸는 일이라
 * 먼저 지웠다가 실패로 되살리면 "방금 승인한 사람이 다시 나타나는" 화면이 된다. 처리 중에는 호출부가
 * `isPending` 으로 그 행의 두 버튼을 막는다(연타 방지).
 *
 * **② 성공 갱신(T643)** — `deploymentKeys.all(siteSeq)` 무효화로 **요약 · 요청 · 이력을 한 번에**
 * 다시 받는다(승인 1번이 셋을 다 바꾼다). 사이드바 뱃지도 같은 요약 쿼리라 함께 줄어든다.
 *
 * **③ 실패(T644)** — 🔴 **토스트는 여기서 띄우지 않는다** — 전역 `MutationCache.onError`(`queryClient.ts`)가
 * 서버 메시지로 이미 띄운다. 여기서 또 띄우면 두 번 뜬다. 대신 **목록을 다시 받는다** — "이미 처리된
 * 요청" 이면 그 행이 서버에서 사라졌을 것이고, 재조회해야 화면에서도 정리된다.
 */
export const useApproveDeployment = (siteSeq: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (row: DeploymentRequestRow) =>
      approveDeploymentRequest({ requestSeq: row.requestSeq }),
    onSuccess: (_data, row) => {
      notify.success(`${row.userName}님의 ${row.requestTypeName} 요청을 승인했습니다.`)
    },
    // 성공·실패 모두 서버 상태를 다시 받는다(①은 반영, ③은 정리)
    onSettled: () => queryClient.invalidateQueries({ queryKey: deploymentKeys.all(siteSeq) }),
  })
}
