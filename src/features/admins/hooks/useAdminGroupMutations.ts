import { useMutation } from '@tanstack/react-query'

import type { GroupNode } from '@/features/auth/types/site'
import { notify } from '@/lib/notify'
import { getAdminDetail } from '../api/getAdminDetail'
import { updateAdmin } from '../api/updateAdmin'
import { useInvalidateAdmins } from './useAdminAccountMutations'

/**
 * 매니저 담당 그룹 추가 · 해제 (`spec 045` T818 → `spec 056` T1004 — `UpdateAdmin.groupSeq`).
 *
 * - 🔴🔴 `groupSeq` 는 그 관리자의 할당 **교체**라 **PUT 직전에 `GetAdminDetail` 로 현재 할당을 다시 읽는다** — 화면 캐시로
 *   보내면 그 사이 바뀐 할당을 지운다(045 B-50 원칙 승계). 읽기가 실패하면 예외가 올라가 **PUT 은 보내지 않는다**.
 * - 여러 그룹도 요청 1번이다(배열 교체) — 045 의 "그룹마다 차례로 · 첫 실패에서 중단" 은 없다.
 * - 🔴 비옵티미스틱 · 성공 · 실패 모두 무효화. 실패 토스트는 전역 `MutationCache.onError`.
 */

const replaceGroups = async (userSeq: number, change: (current: number[]) => number[]) => {
  const detail = await getAdminDetail(userSeq)
  await updateAdmin({ userSeq, groupSeq: change(detail.groupSeq ?? []) })
}

export const useAddAdminGroups = () => {
  const invalidate = useInvalidateAdmins()
  return useMutation({
    mutationFn: ({ userSeq, groups }: { userSeq: number; groups: GroupNode[] }) =>
      replaceGroups(userSeq, (current) => [
        ...current,
        ...groups.map((group) => group.groupSeq).filter((seq) => !current.includes(seq)),
      ]),
    onSuccess: () => notify.success('담당 그룹을 추가했습니다.'),
    onSettled: invalidate,
  })
}

export const useRemoveAdminGroup = () => {
  const invalidate = useInvalidateAdmins()
  return useMutation({
    mutationFn: ({ userSeq, group }: { userSeq: number; group: GroupNode }) =>
      replaceGroups(userSeq, (current) => current.filter((seq) => seq !== group.groupSeq)),
    onSuccess: () => notify.success('담당 그룹에서 해제했습니다.'),
    onSettled: invalidate,
  })
}
