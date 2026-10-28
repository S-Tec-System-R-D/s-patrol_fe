import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { notify } from '@/lib/notify'
import { addEmergency } from '../api/addEmergency'
import { deleteEmergency } from '../api/deleteEmergency'
import { getEmergency } from '../api/getEmergency'
import { getEmergencyUserTree } from '../api/getEmergencyUserTree'
import { emergencyKeys } from '../queryKeys'
import type { EmergencyDay } from '../types/emergency'

/**
 * 비상연락망 조회 · 추가 · 해제 (`spec 057` T1023).
 *
 * - 🔴 등록 · 삭제는 **한 사람 · 한 요일씩**이다 — 여러 명은 **차례로** 보내고 **첫 실패에서 멈춘다**(045 할당과 같다).
 * - 🔴 비옵티미스틱 · 성공 · 실패 모두 그 사업장 7요일 재조회(ID 를 주지 않는다). 후보 트리는 바뀌지 않는다.
 * - 실패 토스트는 전역 `MutationCache.onError`.
 */

export const useEmergencyWeek = (siteSeq: number) =>
  useQuery({ queryKey: emergencyKeys.week(siteSeq), queryFn: () => getEmergency(siteSeq) })

/** 추가 모달이 열렸을 때만 부른다 */
export const useEmergencyTree = (enabled: boolean) =>
  useQuery({ queryKey: emergencyKeys.tree, queryFn: getEmergencyUserTree, enabled })

const useInvalidateWeek = (siteSeq: number) => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: emergencyKeys.week(siteSeq) })
}

export const useAddEmergency = (siteSeq: number) => {
  const invalidate = useInvalidateWeek(siteSeq)
  return useMutation({
    mutationFn: async ({ day, userSeqs }: { day: EmergencyDay; userSeqs: number[] }) => {
      for (const userSeq of userSeqs) await addEmergency({ siteSeq, userSeq, day })
    },
    onSuccess: () => notify.success('비상연락 담당자를 추가했습니다.'),
    onSettled: invalidate,
  })
}

export const useRemoveEmergency = (siteSeq: number) => {
  const invalidate = useInvalidateWeek(siteSeq)
  return useMutation({
    mutationFn: ({ day, userSeq }: { day: EmergencyDay; userSeq: number }) =>
      deleteEmergency({ siteSeq, userSeq, day }),
    onSuccess: () => notify.success('비상연락 담당자에서 해제했습니다.'),
    onSettled: invalidate,
  })
}
