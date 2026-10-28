import api from '@/lib/axios'
import type { AddAdminRequest } from '../types/admin'

/** 관리자 추가 (`spec 056` T992) — `POST /api/v1/AdminUser/W/sign/AddAdmin`. 중복 사번은 400 래퍼(실측) */

const ADD_ADMIN_PATH = '/api/v1/AdminUser/W/sign/AddAdmin'

export const addAdmin = async (body: AddAdminRequest): Promise<void> => {
  await api.post(ADD_ADMIN_PATH, body)
}
