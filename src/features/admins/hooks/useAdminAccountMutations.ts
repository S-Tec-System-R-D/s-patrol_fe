import { useMutation, useQueryClient } from '@tanstack/react-query'

import { groupKeys } from '@/features/groups/queryKeys'
import { siteKeys } from '@/features/sites/queryKeys'
import { notify } from '@/lib/notify'
import { addAdmin } from '../api/addAdmin'
import { deleteAdmin } from '../api/deleteAdmin'
import { resetAdminPassword } from '../api/resetAdminPassword'
import { updateAdmin } from '../api/updateAdmin'
import { adminKeys } from '../queryKeys'

/**
 * 관리자 계정 추가 · 수정 · 비밀번호 · 삭제 (`spec 056` T1000).
 *
 * - 🔴 서버는 ID 를 주지 않는다 → 비옵티미스틱 · 성공 · 실패 모두 목록 재조회(남이 지운 계정이면 행이 사라지고 상세가 닫힌다).
 * - 그룹 할당 조회(`GetGroupAdminList` — 그룹 이름 변경 · 사업장 담당 관리자 카드)도 같은 사람을 보여 주므로 함께 무효화한다.
 * - 실패 토스트는 전역 `MutationCache.onError` 가 서버 문구로 띄운다(중복 사번 "이미 사용중인 아이디입니다." 등).
 */

export const useInvalidateAdmins = () => {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminKeys.list }),
      queryClient.invalidateQueries({ queryKey: adminKeys.detailAll }),
      queryClient.invalidateQueries({ queryKey: groupKeys.adminsAll }),
      // 사업장 상세 담당 관리자 카드(`spec 057`)
      queryClient.invalidateQueries({ queryKey: siteKeys.managersAll }),
    ])
}

export const useAddAdmin = () => {
  const invalidate = useInvalidateAdmins()
  return useMutation({
    mutationFn: addAdmin,
    onSuccess: () => notify.success('관리자를 추가했습니다.'),
    onSettled: invalidate,
  })
}

export const useUpdateAdmin = () => {
  const invalidate = useInvalidateAdmins()
  return useMutation({
    mutationFn: updateAdmin,
    onSuccess: () => notify.success('관리자 정보를 수정했습니다.'),
    onSettled: invalidate,
  })
}

/** 화면 값이 바뀌지 않아 성공은 무효화하지 않는다 — 실패(남이 지움)만 다시 읽는다(041 `PasswordForm` 과 같다) */
export const useResetAdminPassword = () => {
  const invalidate = useInvalidateAdmins()
  return useMutation({
    mutationFn: resetAdminPassword,
    onSuccess: () => notify.success('비밀번호를 변경했습니다.'),
    onError: invalidate,
  })
}

export const useDeleteAdmin = () => {
  const invalidate = useInvalidateAdmins()
  return useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => notify.success('관리자를 삭제했습니다.'),
    onSettled: invalidate,
  })
}
