import api from '@/lib/axios'

/**
 * 근무자 삭제 (`spec 041` T683).
 *
 * `DELETE /api/v1/User/W/sign/RemoveUser?userSeq=`
 *
 * 🔴 **완전 삭제로 보인다**(실측 2026-10-21) — 상세 404 · 로그인 불가 · 같은 사번 재사용 가능.
 * 없는 ID·이중 삭제는 400 래퍼.
 */

const REMOVE_USER_PATH = '/api/v1/User/W/sign/RemoveUser'

export const removeUser = async (userSeq: number): Promise<void> => {
  await api.delete(REMOVE_USER_PATH, { params: { userSeq } })
}
