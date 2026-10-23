import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GroupNode } from '@/features/auth/types/site'
import { getGroupAdminList } from '@/features/groups/api/getGroupAdminList'
import { updateGroup } from '@/features/groups/api/updateGroup'
import { groupKeys } from '@/features/groups/queryKeys'
import { notify } from '@/lib/notify'

/**
 * 관리자 담당 그룹 추가 · 해제 (`spec 045` T818) — 할당 API 는 `UpdateGroup.userSeq` 하나뿐이다.
 *
 * - 🔴🔴 `userSeq` 는 **교체**라(B-50) **PUT 직전에 그 그룹의 현재 할당을 다시 읽는다** — 화면 캐시로 보내면 그 사이
 *   바뀐 할당을 지운다. 읽기가 실패하면 예외가 올라가 **그 PUT 은 보내지 않는다**(043 `useRenameGroup` 과 같다).
 * - 여러 그룹은 **차례로** 보내고 **첫 실패에서 멈춘다**. 어디까지 됐는지는 재조회가 보여 준다.
 * - 🔴 비옵티미스틱 · 성공 · 실패 모두 할당 전체 + 트리 무효화(Master 가 자기를 해제하면 트리 범위가 바뀐다 — 실측).
 * - 실패 토스트는 전역 `MutationCache.onError` 가 서버 문구로 띄운다.
 */

/** 이름 · 위치는 그대로 두고 할당만 바꾼다 */
const replaceAssignment = async (group: GroupNode, change: (current: number[]) => number[]) => {
  // 회사(루트)는 화면이 막는다(OQ-045-A — 미실측). 여기 오면 호출부 버그다
  if (group.parentGroupSeq === null) throw new Error('최상위 그룹은 변경할 수 없습니다.')
  const rows = await getGroupAdminList(group.groupSeq)
  const current = rows.filter((row) => row.isInclude).map((row) => row.userSeq)
  await updateGroup({
    groupSeq: group.groupSeq,
    parentGroupSeq: group.parentGroupSeq,
    groupName: group.groupName,
    userSeq: change(current),
  })
}

const useInvalidateAssignments = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: groupKeys.adminsAll }),
      queryClient.invalidateQueries({ queryKey: groupKeys.tree }),
    ])
}

export const useAddAdminGroups = () => {
  const invalidate = useInvalidateAssignments()
  return useMutation({
    mutationFn: async ({ userSeq, groups }: { userSeq: number; groups: GroupNode[] }) => {
      for (const group of groups) {
        await replaceAssignment(group, (current) =>
          current.includes(userSeq) ? current : [...current, userSeq]
        )
      }
    },
    onSuccess: () => notify.success('담당 그룹을 추가했습니다.'),
    onSettled: invalidate,
  })
}

export const useRemoveAdminGroup = () => {
  const invalidate = useInvalidateAssignments()
  return useMutation({
    mutationFn: ({ userSeq, group }: { userSeq: number; group: GroupNode }) =>
      replaceAssignment(group, (current) => current.filter((seq) => seq !== userSeq)),
    onSuccess: () => notify.success('담당 그룹에서 해제했습니다.'),
    onSettled: invalidate,
  })
}
