import api from '@/lib/axios'
import type { UpdateAdminRequest } from '../types/admin'

/**
 * 관리자 수정 (`spec 056` T992) — `PUT /api/v1/AdminUser/W/sign/UpdateAdmin`.
 *
 * 생략한 필드는 유지된다(실측). 🔴 `groupSeq` 는 할당 **교체**라 담당 그룹 변경은 `useAdminGroupMutations` 로만 보낸다.
 */

const UPDATE_ADMIN_PATH = '/api/v1/AdminUser/W/sign/UpdateAdmin'

export const updateAdmin = async (body: UpdateAdminRequest): Promise<void> => {
  await api.put(UPDATE_ADMIN_PATH, body)
}
