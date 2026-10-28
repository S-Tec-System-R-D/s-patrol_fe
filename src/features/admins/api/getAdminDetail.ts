import api from '@/lib/axios'
import type { AdminDetail } from '../types/admin'

/**
 * 관리자 상세 (`spec 056` T992) — `GET /api/v1/AdminUser/W/sign/GetAdminDetail?userSeq=`.
 *
 * 상세 모달의 사번(`useAdminDetail`) · 담당 그룹을 바꾸기 **직전에 현재 할당을 다시 읽기**(`useAdminGroupMutations`).
 * 🔴 시스템관리자는 400 이다(실측) — 화면에 시스템관리자가 없어 부를 일이 없다.
 */

const GET_ADMIN_DETAIL_PATH = '/api/v1/AdminUser/W/sign/GetAdminDetail'

export const getAdminDetail = async (userSeq: number): Promise<AdminDetail> => {
  const res = await api.get<AdminDetail>(GET_ADMIN_DETAIL_PATH, { params: { userSeq } })
  return res.data
}
