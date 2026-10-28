import api from '@/lib/axios'
import type { ResetAdminPasswordRequest } from '../types/admin'

/** 관리자 비밀번호 변경 (`spec 056` T992) — `PUT /api/v1/AdminUser/W/sign/ResetAdminPassword`. 즉시 반영(실측) */

const RESET_ADMIN_PASSWORD_PATH = '/api/v1/AdminUser/W/sign/ResetAdminPassword'

export const resetAdminPassword = async (body: ResetAdminPasswordRequest): Promise<void> => {
  await api.put(RESET_ADMIN_PASSWORD_PATH, body)
}
