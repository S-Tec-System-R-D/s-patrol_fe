import api from '@/lib/axios'
import type { AdminGroupNode } from '../types/admin'

/** 관리자 목록 (`spec 056` T992) — `GET /api/v1/AdminUser/W/sign/GetAdminList`. 그룹 트리 루트 1개(`api-spec.md` §5-1-C) */

const GET_ADMIN_LIST_PATH = '/api/v1/AdminUser/W/sign/GetAdminList'

export const getAdminList = async (): Promise<AdminGroupNode> => {
  const res = await api.get<AdminGroupNode>(GET_ADMIN_LIST_PATH)
  return res.data
}
