import { useMutation, useQueryClient } from '@tanstack/react-query'

import { notify } from '@/lib/notify'
import { approveAssignment } from '../api/approveAssignment'
import { approveAssignmentReturn } from '../api/approveAssignmentReturn'
import { deploymentKeys } from '../queryKeys'
import type { RequestKind } from '../types/deployment'

/**
 * 배치·복귀 요청 승인/반려 (`spec 039` T642~T644 → `spec 042` T706) — 🔴 A급이라 세 단계를 나눠 적는다.
 *
 * **① 제출** — 🔴 **비옵티미스틱**(023 승계). 승인은 다른 사업장 사람의 소속을 바꾸는 일이라
 * 먼저 지웠다가 실패로 되살리면 "방금 승인한 사람이 다시 나타나는" 화면이 된다. 처리 중에는 호출부가
 * `isPending` 으로 그 행의 두 버튼을 막는다(연타 방지).
 *
 * **② 성공 갱신** — `deploymentKeys.all(siteSeq)` 무효화로 **요약 · 요청 · 이력을 한 번에**, `user()` 로
 * 근무자 상세의 배치 이력까지 다시 받는다. 사이드바 뱃지도 같은 요약 쿼리라 함께 줄어든다.
 *
 * **③ 실패** — 🔴 **토스트는 여기서 띄우지 않는다** — 전역 `MutationCache.onError`(`queryClient.ts`)가
 * 서버 메시지로 이미 띄운다. 대신 **목록을 다시 받는다** — "이미 처리된 배치" 면 그 행이 서버에서 사라졌다.
 *
 * 🔴 **승인·반려가 같은 API** 다(`approved`, 실측) — 039 의 승인·거부 훅 둘을 하나로 합쳤다.
 * 🔴 `approved` 를 **항상** 보낸다 — 빼면 서버가 반려로 처리한다(B-48).
 */
export const REQUEST_KIND_LABEL: Record<RequestKind, string> = { deploy: '배치', return: '복귀' }

export interface ProcessAssignmentVariables {
  assignmentSeq: number
  userName: string
  approved: boolean
}

export const useApproveDeployment = (siteSeq: number, kind: RequestKind = 'deploy') => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ assignmentSeq, approved }: ProcessAssignmentVariables) =>
      kind === 'return'
        ? approveAssignmentReturn({ assignmentSeq, approved })
        : approveAssignment({ assignmentSeq, approved }),
    onSuccess: (_data, { userName, approved }) => {
      notify.success(
        `${userName}님의 ${REQUEST_KIND_LABEL[kind]} 요청을 ${approved ? '승인' : '반려'}했습니다.`
      )
    },
    // 성공·실패 모두 서버 상태를 다시 받는다(②는 반영, ③은 정리)
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: deploymentKeys.all(siteSeq) }),
        queryClient.invalidateQueries({ queryKey: deploymentKeys.user() }),
      ]),
  })
}
