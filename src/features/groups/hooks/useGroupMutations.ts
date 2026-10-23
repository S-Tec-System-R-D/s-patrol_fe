import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { GroupNode } from '@/features/auth/types/site'
import { notify } from '@/lib/notify'
import { addGroup } from '../api/addGroup'
import { deleteGroup } from '../api/deleteGroup'
import { getGroupAdminList } from '../api/getGroupAdminList'
import { updateGroup } from '../api/updateGroup'
import { groupKeys } from '../queryKeys'

/**
 * 관리그룹 추가 · 이름 변경 · 삭제 (`spec 043` T739).
 *
 * - 🔴 **비옵티미스틱** — 서버가 새 `groupSeq` 를 주지 않아 미리 그릴 수도 없다. 성공·실패 모두 트리를 다시 받는다
 *   (실패 중 "관리그룹이 존재하지 않습니다." 는 남이 먼저 지운 경우라 재조회가 곧 정리다).
 * - 🔴 **실패 토스트는 여기서 띄우지 않는다** — 전역 `MutationCache.onError` 가 서버 문구로 띄운다. 같은 이름 409 도
 *   그 문구 그대로다(사용자 결정 2026-10-22).
 */

/** 🔴 사업장 목록(`list`)도 함께 — 그룹 삭제가 소속 사업장까지 지운다(B-51, `spec 044` T784) */
const useInvalidateTree = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: groupKeys.tree }),
      queryClient.invalidateQueries({ queryKey: groupKeys.list }),
    ])
}

export const useAddGroup = () => {
  const invalidate = useInvalidateTree()
  return useMutation({
    mutationFn: ({ parent, groupName }: { parent: GroupNode; groupName: string }) =>
      addGroup({ parentGroupSeq: parent.groupSeq, groupName, userSeq: [] }),
    onSuccess: () => notify.success('그룹을 추가했습니다.'),
    onSettled: invalidate,
  })
}

/**
 * 🔴🔴 `UpdateGroup` 의 `userSeq` 는 **교체**라 빼면 할당이 지워진다(B-50) → **현재 할당을 먼저 읽어 그대로 싣는다.**
 * 그 조회가 실패하면 예외가 그대로 올라가 **PUT 을 보내지 않는다**(빈 배열로 보내면 할당이 사라진다).
 * `parentGroupSeq` 도 현재 값 그대로다 — 이동 기능은 없다.
 */
export const useRenameGroup = () => {
  const invalidate = useInvalidateTree()
  return useMutation({
    mutationFn: async ({ group, groupName }: { group: GroupNode; groupName: string }) => {
      // 루트는 화면이 막는다(이름 변경 버튼 없음). 여기 오면 호출부 버그다
      if (group.parentGroupSeq === null) throw new Error('최상위 그룹은 변경할 수 없습니다.')
      const admins = await getGroupAdminList(group.groupSeq)
      await updateGroup({
        groupSeq: group.groupSeq,
        parentGroupSeq: group.parentGroupSeq,
        groupName,
        userSeq: admins.filter((admin) => admin.isInclude).map((admin) => admin.userSeq),
      })
    },
    onSuccess: () => notify.success('그룹 이름을 변경했습니다.'),
    onSettled: invalidate,
  })
}

/** 🔴 하위 그룹·소속 사업장까지 함께 지워진다(B-51) — 확인창은 호출부 책임 */
export const useDeleteGroup = () => {
  const invalidate = useInvalidateTree()
  return useMutation({
    mutationFn: (group: GroupNode) => deleteGroup(group.groupSeq),
    onSuccess: () => notify.success('그룹을 삭제했습니다.'),
    onSettled: invalidate,
  })
}
